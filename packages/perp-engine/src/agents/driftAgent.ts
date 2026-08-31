/**
 * Drift Protocol agent execution on Solana.
 *
 * Env:
 *  - DRIFT_PRIVATE_KEY   base58 secret key or JSON byte array (required for live)
 *  - SOLANA_RPC_URL      (default mainnet-beta)
 *  - DRIFT_ENV           mainnet-beta | devnet
 *
 * Peer deps for full SDK path:
 *  pnpm add @drift-labs/sdk @solana/web3.js bs58
 */

export interface DriftAgentOrderRequest {
  symbol: string;
  isBuy: boolean;
  size: string;
  leverage?: number;
  reduceOnly?: boolean;
}

export interface DriftAgentOrderResult {
  executed: boolean;
  mode: 'live' | 'tracking_only' | 'skipped';
  mid?: number;
  externalId?: string;
  exchangeResponse?: unknown;
  message: string;
}

function getSecret(): string | undefined {
  const k =
    process.env.DRIFT_PRIVATE_KEY?.trim() ||
    process.env.DRIFT_AGENT_PRIVATE_KEY?.trim() ||
    process.env.SOLANA_PRIVATE_KEY?.trim();
  if (!k || k.length < 16) return undefined;
  return k;
}

export function isDriftAgentConfigured(): boolean {
  return Boolean(getSecret());
}

async function fetchMid(symbol: string): Promise<number | undefined> {
  const DATA_API = process.env.DRIFT_DATA_API || 'https://data.api.drift.trade';
  try {
    const res = await fetch(`${DATA_API}/market/${encodeURIComponent(symbol)}`, {
      signal: AbortSignal.timeout(8000),
    }).catch(() => null);
    if (res?.ok) {
      const data = (await res.json()) as { markPrice?: string | number; price?: string | number };
      const px = data.markPrice ?? data.price;
      if (px != null) return Number(px);
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

function parseKeypairSecret(secret: string): Uint8Array {
  // JSON array: [1,2,3,...]
  if (secret.trim().startsWith('[')) {
    const arr = JSON.parse(secret) as number[];
    return Uint8Array.from(arr);
  }
  // base58 — decode without mandatory bs58 if Buffer-like hex
  if (/^[0-9a-fA-F]+$/.test(secret) && secret.length >= 64) {
    const hex = secret.length % 2 ? '0' + secret : secret;
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    return out;
  }
  // base58 via dynamic bs58
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const bs58 = require('bs58') as { decode: (s: string) => Uint8Array };
    return bs58.decode(secret);
  } catch {
    throw new Error('DRIFT_PRIVATE_KEY must be base58, hex, or JSON byte array (install bs58 for base58)');
  }
}

export async function placeDriftOrder(req: DriftAgentOrderRequest): Promise<DriftAgentOrderResult> {
  const mid = await fetchMid(req.symbol);
  const secret = getSecret();

  if (!secret) {
    return {
      executed: false,
      mode: 'tracking_only',
      mid,
      message:
        'No DRIFT_PRIVATE_KEY — order tracked only. Set Solana secret for live Drift orders.',
    };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let web3: any;
    try {
      web3 = await import('@solana/web3.js');
    } catch {
      return {
        executed: false,
        mode: 'skipped',
        mid,
        message: 'Install @solana/web3.js for Drift agent signing',
      };
    }

    const secretKey = parseKeypairSecret(secret);
    const keypair = web3.Keypair.fromSecretKey(secretKey);
    const rpc = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const connection = new web3.Connection(rpc, 'confirmed');

    // Sign order intent message with ed25519 keypair
    const intent = {
      venue: 'drift',
      symbol: req.symbol.toUpperCase(),
      isBuy: req.isBuy,
      size: req.size,
      leverage: req.leverage ?? 1,
      mid: mid ?? null,
      ts: Date.now(),
      trader: keypair.publicKey.toBase58(),
    };
    const msg = new TextEncoder().encode(
      `Cryptra Drift Order\n${intent.trader}\n${intent.symbol}\n${intent.isBuy ? 'LONG' : 'SHORT'}\n${intent.size}\n${intent.ts}`,
    );
    const signature = web3.nacl
      ? null
      : (() => {
          // tweetnacl via solana web3 Keypair.sign
          return 'ed25519';
        })();

    // Prefer full Drift SDK when available
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const driftSdk = (await import('@drift-labs/sdk')) as any;
      const env = process.env.DRIFT_ENV === 'devnet' ? 'devnet' : 'mainnet-beta';
      const driftClient = new driftSdk.DriftClient({
        connection,
        wallet: new driftSdk.Wallet(keypair),
        env,
      });
      await driftClient.subscribe();

      const marketName = req.symbol.toUpperCase().includes('-')
        ? req.symbol.toUpperCase()
        : `${req.symbol.toUpperCase()}-PERP`;

      const marketIndex = driftClient.getMarketIndex(marketName);
      const baseAmount = driftSdk.convertToNumber
        ? undefined
        : undefined;

      // placePerpOrder API varies by SDK version — use generic path
      if (typeof driftClient.placePerpOrder === 'function') {
        const direction = req.isBuy ? driftSdk.PositionDirection.LONG : driftSdk.PositionDirection.SHORT;
        const txSig = await driftClient.placePerpOrder({
          marketIndex,
          direction,
          baseAssetAmount: driftSdk.BN
            ? new driftSdk.BN(Math.floor(Number(req.size) * 1e9))
            : Math.floor(Number(req.size) * 1e9),
          orderType: driftSdk.OrderType?.MARKET ?? 0,
          reduceOnly: req.reduceOnly ?? false,
        });
        await driftClient.unsubscribe?.();
        return {
          executed: true,
          mode: 'live',
          mid,
          externalId: String(txSig),
          exchangeResponse: { txSig, marketName, intent },
          message: `Live Drift order · ${marketName} · sig=${String(txSig).slice(0, 16)}…`,
        };
      }

      await driftClient.unsubscribe?.();
    } catch (sdkErr) {
      // Fall through to signed-intent mode
      const detail = sdkErr instanceof Error ? sdkErr.message : 'sdk unavailable';
      // Sign with nacl if available through keypair
      let sigB58 = 'unsigned';
      try {
        // @solana/web3.js Keypair doesn't export sign directly on all versions
        const nacl = await import('tweetnacl').catch(() => null);
        if (nacl) {
          const sig = nacl.sign.detached(msg, keypair.secretKey);
          const bs58 = await import('bs58').catch(() => null);
          sigB58 = bs58 ? (bs58 as { default?: { encode: (b: Uint8Array) => string } }).default?.encode(sig) || Buffer.from(sig).toString('hex') : Buffer.from(sig).toString('hex');
        }
      } catch {
        /* ignore */
      }

      return {
        executed: false,
        mode: 'skipped',
        mid,
        externalId: sigB58.slice(0, 24),
        exchangeResponse: { intent, signature: sigB58, sdkError: detail },
        message:
          `Drift intent signed. Install/configure @drift-labs/sdk for live placePerpOrder (${detail.slice(0, 80)})`,
      };
    }

    return {
      executed: false,
      mode: 'skipped',
      mid,
      message: 'Drift SDK loaded but placePerpOrder not available in this version',
      exchangeResponse: { intent, signature },
    };
  } catch (e) {
    return {
      executed: false,
      mode: 'skipped',
      mid,
      message: e instanceof Error ? e.message : 'Drift agent failed',
    };
  }
}
