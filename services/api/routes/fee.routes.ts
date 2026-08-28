import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { AppError, ErrorCodes, resolveBaseFeePercentMicros, getFeeTier, FEE_TIERS } from '@cryptra/core';
import { feeCalculator } from '@cryptra/fees';

const previewSchema = z.object({
  amount: z.string().min(1),
  feePercent: z.number().positive().optional(),
});

const calculateSchema = z.object({
  amount: z.string().min(1),
  volumeUsd: z.number().nonnegative().optional(),
});

export async function feeRoutes(app: FastifyInstance) {
  app.get('/tiers', async () => {
    return {
      success: true,
      data: FEE_TIERS.map((t) => ({
        id: t.id,
        label: t.label,
        percent: t.percent,
        difficulty: t.difficulty,
      })),
    };
  });

  app.post('/preview', async (request) => {
    const body = previewSchema.safeParse(request.body);
    if (!body.success) {
      throw new AppError({
        code: ErrorCodes.VALIDATION_FAILED,
        message: body.error.message,
      });
    }
    const result = feeCalculator.preview(body.data.amount, body.data.feePercent);
    return { success: true, data: result };
  });

  app.post('/calculate', { preHandler: requireAuth }, async (request) => {
    const body = calculateSchema.safeParse(request.body);
    if (!body.success) {
      throw new AppError({
        code: ErrorCodes.VALIDATION_FAILED,
        message: body.error.message,
      });
    }
    const userId = request.user!.userId;
    const result = await feeCalculator.calculate({
      userId,
      amount: body.data.amount,
      volumeUsd: body.data.volumeUsd,
    });
    return { success: true, data: result };
  });

  app.get('/resolve-base', async (request) => {
    const q = z
      .object({
        tierId: z.coerce.number().int().min(1).max(6).default(1),
        tradeSizeUsd: z.coerce.number().nonnegative().default(0),
      })
      .safeParse(request.query);
    if (!q.success) {
      throw new AppError({
        code: ErrorCodes.VALIDATION_FAILED,
        message: q.error.message,
      });
    }
    const micros = resolveBaseFeePercentMicros(
      q.data.tierId as 1 | 2 | 3 | 4 | 5 | 6,
      q.data.tradeSizeUsd,
    );
    const tier = getFeeTier(q.data.tierId as 1 | 2 | 3 | 4 | 5 | 6);
    return {
      success: true,
      data: {
        percentMicros: micros,
        percent: (micros / 1_000_000).toFixed(3),
        tier,
      },
    };
  });
}
