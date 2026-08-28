import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { AppError, ErrorCodes } from '@cryptra/core';
import { hyperliquidClient } from '@cryptra/hyperliquid';

/**
 * Perpetuals market data via Hyperliquid public API.
 * Order execution remains on /api/v1/orders (agent key optional).
 */
export async function perpRoutes(app: FastifyInstance) {
  app.get('/markets', async () => {
    try {
      const majors = await hyperliquidClient.getMajorPerps();
      return { success: true, data: majors };
    } catch (e) {
      throw new AppError({
        code: ErrorCodes.EXTERNAL_SERVICE_ERROR,
        message: e instanceof Error ? e.message : 'Hyperliquid unavailable',
      });
    }
  });

  app.get('/mid/:symbol', async (request) => {
    const params = z.object({ symbol: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      throw new AppError({
        code: ErrorCodes.VALIDATION_FAILED,
        message: params.error.message,
      });
    }
    try {
      const mid = await hyperliquidClient.getMid(params.data.symbol.toUpperCase());
      if (mid == null) {
        throw new AppError({
          code: ErrorCodes.NOT_FOUND,
          message: `No mid for ${params.data.symbol}`,
        });
      }
      return { success: true, data: { symbol: params.data.symbol.toUpperCase(), mid } };
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw new AppError({
        code: ErrorCodes.EXTERNAL_SERVICE_ERROR,
        message: e instanceof Error ? e.message : 'Hyperliquid mid failed',
      });
    }
  });

  app.get('/meta', async () => {
    try {
      const meta = await hyperliquidClient.getMetaAndAssetCtxs();
      return {
        success: true,
        data: {
          universe: meta.universe,
          assetCtxsCount: meta.assetCtxs.length,
        },
      };
    } catch (e) {
      throw new AppError({
        code: ErrorCodes.EXTERNAL_SERVICE_ERROR,
        message: e instanceof Error ? e.message : 'Hyperliquid meta failed',
      });
    }
  });

  app.get('/positions', { preHandler: requireAuth }, async (request) => {
    const { prisma } = await import('@cryptra/database');
    const positions = await prisma.position.findMany({
      where: { userId: request.user!.userId, status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
    });
    return { success: true, data: positions };
  });
}
