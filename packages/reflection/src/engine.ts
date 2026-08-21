import { prisma } from '@cryptra/database';
import { detectPatterns, buildSummary, type ReflectionReport } from './patterns';

export class ReflectionEngine {
  /**
   * Generate a weekly (or custom period) reflection report for a user.
   */
  async generateReport(userId: string, periodDays = 7): Promise<ReflectionReport> {
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    const [swaps, orders] = await Promise.all([
      prisma.swap.findMany({
        where: { userId, createdAt: { gte: since } },
        select: { createdAt: true, status: true },
      }),
      prisma.order.findMany({
        where: { userId, createdAt: { gte: since } },
        select: { createdAt: true, leverage: true, status: true },
      }),
    ]);

    const patterns = detectPatterns({ swaps, orders, periodDays });
    const summary = buildSummary(patterns, swaps.length + orders.length);

    return {
      userId,
      periodDays,
      swapCount: swaps.length,
      orderCount: orders.length,
      patterns,
      summary,
      generatedAt: new Date(),
    };
  }
}

export const reflectionEngine = new ReflectionEngine();
