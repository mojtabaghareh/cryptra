import { prisma } from '@cryptra/database';
import { marketDataService } from '@cryptra/market-data';

export interface PortfolioAsset {
  symbol: string;
  chain?: string;
  balance: string;
  priceUsd?: number;
  valueUsd?: number;
  change24h?: number;
}

export interface PortfolioSummary {
  userId: string;
  totalValueUsd: number;
  assets: PortfolioAsset[];
  openPositions: number;
  recentSwaps: number;
  updatedAt: Date;
}

/**
 * Portfolio service — aggregates wallets, swaps and open positions.
 * Price enrichment via market-data (CoinGecko ids when available).
 */
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

    // Placeholder assets from connected wallets (balances filled by chain adapters later)
    const assets: PortfolioAsset[] = wallets.map((w) => ({
      symbol: w.chainType,
      chain: w.chainType,
      balance: '0',
    }));

    // Enrich with major market prices for UI context
    let totalValueUsd = 0;
    try {
      const prices = await marketDataService.getMajorPrices();
      // Without real on-chain balances we only expose market context
      void prices;
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
