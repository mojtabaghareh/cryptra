import { prisma } from '@cryptra/database';

export interface ActivityItem {
  kind: 'swap' | 'order';
  id: string;
  userId: string;
  summary: string;
  status: string;
  createdAt: Date;
}

export class ActivityFeed {
  async list(limit = 30): Promise<ActivityItem[]> {
    const take = Math.min(100, Math.max(1, limit));
    const [swaps, orders] = await Promise.all([
      prisma.swap
        .findMany({
          orderBy: { createdAt: 'desc' },
          take,
          select: {
            id: true,
            userId: true,
            status: true,
            fromSymbol: true,
            toSymbol: true,
            createdAt: true,
          },
        })
        .catch(() => []),
      prisma.order
        .findMany({
          orderBy: { createdAt: 'desc' },
          take,
          select: {
            id: true,
            userId: true,
            symbol: true,
            side: true,
            status: true,
            createdAt: true,
          },
        })
        .catch(() => []),
    ]);

    return [
      ...swaps.map((s) => ({
        kind: 'swap' as const,
        id: s.id,
        userId: s.userId,
        summary: `${s.fromSymbol}→${s.toSymbol}`,
        status: String(s.status),
        createdAt: s.createdAt,
      })),
      ...orders.map((o) => ({
        kind: 'order' as const,
        id: o.id,
        userId: o.userId,
        summary: `${o.side} ${o.symbol}`,
        status: String(o.status),
        createdAt: o.createdAt,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, take);
  }
}

export const activityFeed = new ActivityFeed();
