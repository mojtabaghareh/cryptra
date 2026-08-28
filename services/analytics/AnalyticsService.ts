import { prisma } from '@cryptra/database';

export class AnalyticsService {
  async overview() {
    const [users, swaps, orders] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.swap.count().catch(() => 0),
      prisma.order.count().catch(() => 0),
    ]);
    return {
      users,
      swaps,
      orders,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const analyticsService = new AnalyticsService();
