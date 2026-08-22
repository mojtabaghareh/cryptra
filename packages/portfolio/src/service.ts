import { prisma } from '@cryptra/database';
import { marketDataService } from '@cryptra/market-data';

export interface PortfolioAsset {
  symbol: string;
  chain?: string;
  address?: string;
  balance: string;
  balanceFormatted?: string;
  priceUsd?: number;
  valueUsd?: number;
  change24h?: number;
  error?: string;
}

export interface PortfolioSummary {
  userId: string;
  totalValueUsd: number;
  assets: PortfolioAsset[];
  openPositions: number;
  recentSwaps: number;
  updatedAt: Date;
}

const EVM_RPC =
  process.env.EVM_RPC_URL ||
  (process.env.ALCHEMY_API_KEY
    ? `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
    : 'https://ethereum.publicnode.com');

const SOLANA_RPC = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

const TON_API =
  process.env.TON_API_URL || 'https://toncenter.com/api/v2';

async function rpcJson(url: string, body: unknown): Promise<any> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`RPC ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || 'RPC error');
  return json.result;
}

async function fetchNative(chainType: string, address: string): Promise<{
  symbol: string;
  balance: string;
  balanceFormatted: string;
  error?: string;
}> {
  try {
    if (chainType === 'EVM') {
      const hex = (await rpcJson(EVM_RPC, {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [address, 'latest'],
      })) as string;
      const wei = BigInt(hex);
      return {
        symbol: 'ETH',
        balance: wei.toString(),
        balanceFormatted: (Number(wei) / 1e18).toFixed(6),
      };
    }
    if (chainType === 'SOLANA') {
      const result = await rpcJson(SOLANA_RPC, {
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [address],
      });
      const lamports = Number(result?.value ?? 0);
      return {
        symbol: 'SOL',
        balance: String(lamports),
        balanceFormatted: (lamports / 1e9).toFixed(6),
      };
    }
    if (chainType === 'TON') {
      const key = process.env.TON_API_KEY;
      const url = new URL(`${TON_API}/getAddressBalance`);
      url.searchParams.set('address', address);
      if (key) url.searchParams.set('api_key', key);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`TON ${res.status}`);
      const json = (await res.json()) as { ok?: boolean; result?: string; error?: string };
      if (json.error) throw new Error(json.error);
      const nano = BigInt(json.result ?? '0');
      return {
        symbol: 'TON',
        balance: nano.toString(),
        balanceFormatted: (Number(nano) / 1e9).toFixed(6),
      };
    }
    return {
      symbol: chainType,
      balance: '0',
      balanceFormatted: '0',
      error: 'unsupported',
    };
  } catch (e) {
    return {
      symbol:
        chainType === 'SOLANA'
          ? 'SOL'
          : chainType === 'EVM'
            ? 'ETH'
            : chainType === 'TON'
              ? 'TON'
              : chainType,
      balance: '0',
      balanceFormatted: '0',
      error: e instanceof Error ? e.message : 'failed',
    };
  }
}

function coingeckoId(symbol: string): string | null {
  if (symbol === 'ETH') return 'ethereum';
  if (symbol === 'SOL') return 'solana';
  if (symbol === 'TON') return 'the-open-network';
  return null;
}

export class PortfolioService {
  async getSummary(userId: string): Promise<PortfolioSummary> {
    const [wallets, openPositions, recentSwaps] = await Promise.all([
      prisma.wallet.findMany({ where: { userId } }),
      prisma.position.count({ where: { userId, status: 'OPEN' } }),
      prisma.swap.count({
        where: {
          userId,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const assets: PortfolioAsset[] = await Promise.all(
      wallets.map(async (w) => {
        const native = await fetchNative(w.chainType, w.address);
        return {
          symbol: native.symbol,
          chain: w.chainType,
          address: w.address,
          balance: native.balance,
          balanceFormatted: native.balanceFormatted,
          error: native.error,
        };
      }),
    );

    let totalValueUsd = 0;
    try {
      const prices = await marketDataService.getMajorPrices();
      const byId = new Map(prices.map((p) => [p.id, p]));

      for (const asset of assets) {
        const id = coingeckoId(asset.symbol);
        if (!id) continue;
        const px = byId.get(id);
        if (!px || !asset.balanceFormatted) continue;
        const qty = Number(asset.balanceFormatted);
        if (!Number.isFinite(qty)) continue;
        asset.priceUsd = px.current_price;
        asset.valueUsd = qty * px.current_price;
        asset.change24h = px.price_change_percentage_24h;
        totalValueUsd += asset.valueUsd;
      }
    } catch {
      // non-blocking
    }

    return {
      userId,
      totalValueUsd,
      assets,
      openPositions,
      recentSwaps,
      updatedAt: new Date(),
    };
  }

  async getTradeHistory(userId: string, limit = 30) {
    const [swaps, orders] = await Promise.all([
      prisma.swap.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    return { swaps, orders };
  }
}

export const portfolioService = new PortfolioService();
