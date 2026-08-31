/**
 * dYdX v4 live order placement via official client (dynamic import).
 *
 * Env:
 *  - DYDX_MNEMONIC or DYDX_PRIVATE_KEY   (required for live)
 *  - DYDX_NETWORK = mainnet | testnet     (default mainnet)
 *  - DYDX_INDEXER_URL                    (optional)
 *
 * Install peer: pnpm add @dydxprotocol/v4-client-js long
 */

export interface DydxAgentOrderRequest {
  symbol: string;
  isBuy: boolean;
  size: string;
  price?: string;
  leverage?: number;
  type?: 'MARKET' | 'LIMIT';
}

export interface DydxAgentOrderResult {
  executed: boolean;
  mode: 'live' | 'tracking_only' | 'skipped';
  mid?: number;
  externalId?: string;
  exchangeResponse?: unknown;
  message: string;
}

function getMnemonicOrKey(): { mnemonic?: string; privateKey?: string } | null {
  const mnemonic = process.env.DYDX_MNEMONIC?.trim() || process.env.DYDX_AGENT_MNEMONIC?.trim();
  const privateKey = process.env.DYDX_PRIVATE_KEY?.trim() || process.env.DYDX_AGENT_PRIVATE_KEY?.trim();
  if (mnemonic) return { mnemonic };
  if (privateKey) return { privateKey };
  return null;
}

export function isDydxAgentConfigured(): boolean {
  return Boolean(getMnemonicOrKey());
}

async function fetchMid(symbol: string): Promise<number | undefined> {
  const indexer = process.env.DYDX_INDEXER_URL || 'https://indexer.dydx.trade/v4';
  const market = symbol.includes('-') ? symbol.toUpperCase() : `${symbol.toUpperCase()}-USD`;
  try {
    const res = await fetch(`${indexer}/perpetualMarkets`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return undefined;
    const body = (await res.json()) as {
      markets?: Record<string, { oraclePrice?: string; midPrice?: string }>;
    };
    const row = body.markets?.[market];
    const px = row?.oraclePrice || row?.midPrice;
    return px != null ? Number(px) : undefined;
  } catch {
    return undefined;
  }
}

export async function placeDydxOrder(req: DydxAgentOrderRequest): Promise<DydxAgentOrderResult> {
  const mid = await fetchMid(req.symbol);
  const creds = getMnemonicOrKey();

  if (!creds) {
    return {
      executed: false,
      mode: 'tracking_only',
      mid,
      message:
        'No DYDX_MNEMONIC / DYDX_PRIVATE_KEY — order tracked only. Set key for live dYdX Chain orders.',
    };
  }

  try {
    // Dynamic import so monorepo builds without the heavy SDK until installed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dydx: any;
    try {
      dydx = await import('@dydxprotocol/v4-client-js');
    } catch {
      return {
        executed: false,
        mode: 'skipped',
        mid,
        message:
          'Install @dydxprotocol/v4-client-js (and long) to enable live dYdX signing: pnpm add @dydxprotocol/v4-client-js long',
      };
    }

    const isTestnet = (process.env.DYDX_NETWORK || 'mainnet').toLowerCase() === 'testnet';
    const network = isTestnet ? dydx.Network.testnet() : dydx.Network.mainnet();
    const client = await dydx.CompositeClient.connect(network);

    let wallet: { address: string };
    if (creds.mnemonic) {
      wallet = await dydx.LocalWallet.fromMnemonic(creds.mnemonic, dydx.BECH32_PREFIX);
    } else if (creds.privateKey) {
      const key = creds.privateKey.startsWith('0x') ? creds.privateKey.slice(2) : creds.privateKey;
      wallet = await dydx.LocalWallet.fromPrivateKey(key, dydx.BECH32_PREFIX);
    } else {
      return { executed: false, mode: 'skipped', mid, message: 'Invalid dYdX credentials' };
    }

    const subaccount = new dydx.SubaccountClient(wallet, 0);
    const market = req.symbol.includes('-') ? req.symbol.toUpperCase() : `${req.symbol.toUpperCase()}-USD`;
    const side = req.isBuy ? dydx.OrderSide.BUY : dydx.OrderSide.SELL;
    const size = Number(req.size);
    if (!Number.isFinite(size) || size <= 0) {
      return { executed: false, mode: 'skipped', mid, message: 'Invalid size' };
    }

    // Aggressive price for market-style IOC
    const slip = 0.05;
    const basePx = req.price != null ? Number(req.price) : mid ?? 0;
    if (!basePx) {
      return { executed: false, mode: 'skipped', mid, message: 'No price for market order' };
    }
    const price = req.isBuy ? basePx * (1 + slip) : basePx * (1 - slip);
    const clientId = Math.floor(Math.random() * 2 ** 31);

    const tx = await client.placeOrder(
      subaccount,
      market,
      dydx.OrderType.MARKET,
      side,
      price,
      size,
      clientId,
      dydx.OrderTimeInForce.IOC,
      0,
      dydx.OrderExecution.IOC,
      false, // postOnly
      false, // reduceOnly
    );

    const hash =
      typeof tx === 'object' && tx && 'hash' in tx
        ? String((tx as { hash: unknown }).hash)
        : `dydx-${clientId}`;

    return {
      executed: true,
      mode: 'live',
      mid,
      externalId: hash,
      exchangeResponse: tx,
      message: `Live dYdX order · ${market} · ${req.isBuy ? 'BUY' : 'SELL'} ${size} · clientId=${clientId}`,
    };
  } catch (e) {
    return {
      executed: false,
      mode: 'skipped',
      mid,
      message: e instanceof Error ? e.message : 'dYdX placeOrder failed',
    };
  }
}
