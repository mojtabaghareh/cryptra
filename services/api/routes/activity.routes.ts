import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@cryptra/database';
import { AppError, ErrorCodes } from '@cryptra/core';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  cursor: z.string().optional(),
});

/**
 * Global activity feed from real swap/order records (no fake events).
 */
export async function activityRoutes(app: FastifyInstance) {
  app.get('/', async (request) => {
    const q = querySchema.safeParse(request.query);
    if (!q.success) {
      throw new AppError({
        code: ErrorCodes.VALIDATION_FAILED,
        message: q.error.message,
      });
    }

    const take = q.data.limit;

    const [swaps, orders] = await Promise.all([
      prisma.swap.findMany({
        orderBy: { createdAt: 'desc' },
        take,
        select: {
          id: true,
          userId: true,
          status: true,
          fromSymbol: true,
          toSymbol: true,
          fromAmount: true,
          toAmount: true,
          createdAt: true,
        },
      }).catch(() => []),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take,
        select: {
          id: true,
          userId: true,
          symbol: true,
          side: true,
          type: true,
          size: true,
          status: true,
          createdAt: true,
        },
      }).catch(() => []),
    ]);

    const events = [
      ...swaps.map((s) => ({
        kind: 'swap' as const,
        id: s.id,
        userId: s.userId,
        summary: `${s.fromSymbol}→${s.toSymbol}`,
        status: s.status,
        createdAt: s.createdAt,
      })),
      ...orders.map((o) => ({
        kind: 'order' as const,
        id: o.id,
        userId: o.userId,
        summary: `${o.side} ${o.symbol}`,
        status: o.status,
        createdAt: o.createdAt,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, take);

    return { success: true, data: events };
  });
}
