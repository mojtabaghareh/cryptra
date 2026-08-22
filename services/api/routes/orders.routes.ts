import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@cryptra/database';
import { requireAuth } from '../middleware/auth';
import { AppError, ErrorCodes } from '@cryptra/core';
import { xpEngine } from '@cryptra/xp';
import { achievementService } from '@cryptra/achievements';
import { referralService } from '@cryptra/referral';
import { hyperliquidClient } from '@cryptra/hyperliquid';

const placeOrderSchema = z.object({
  protocol: z.string().default('hyperliquid'),
  symbol: z.string().min(1),
  side: z.enum(['LONG', 'SHORT']),
  type: z.enum(['MARKET', 'LIMIT', 'STOP_MARKET', 'STOP_LIMIT']).default('MARKET'),
  size: z.string().min(1),
  price: z.string().optional(),
  stopPrice: z.string().optional(),
  leverage: z.number().int().min(1).max(50).default(1),
});

export async function ordersRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

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

  app.get('/', async (request) => {
    const orders = await prisma.order.findMany({
      where: { userId: request.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return { success: true, data: orders };
  });

  app.get('/positions', async (request) => {
    const positions = await prisma.position.findMany({
      where: { userId: request.user!.userId, status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
    });
    return { success: true, data: positions };
  });

  app.post('/', async (request) => {
    const body = placeOrderSchema.safeParse(request.body);
    if (!body.success) {
      throw new AppError({
        code: ErrorCodes.VALIDATION_FAILED,
        message: body.error.message,
      });
    }

    const data = body.data;
    const userId = request.user!.userId;

    let fillPrice = data.price;
    let hlMeta: { source: string; mid: number } | null = null;

    if (data.protocol === 'hyperliquid' && data.type === 'MARKET') {
      try {
        const mid = await hyperliquidClient.getMid(data.symbol.toUpperCase());
        if (mid != null) {
          fillPrice = String(mid);
          hlMeta = { source: 'hyperliquid_mid', mid };
        }
      } catch (err) {
        console.warn('[orders] HL mid fetch failed, continuing without', err);
      }
    }

    const order = await prisma.order.create({
      data: {
        userId,
        protocol: data.protocol,
        symbol: data.symbol.toUpperCase(),
        side: data.side,
        type: data.type,
        size: data.size,
        price: fillPrice ?? data.price,
        stopPrice: data.stopPrice,
        leverage: data.leverage,
        status: 'OPEN',
      },
    });

    let position = null;
    if (data.type === 'MARKET') {
      position = await prisma.position.create({
        data: {
          userId,
          orderId: order.id,
          protocol: data.protocol,
          symbol: data.symbol.toUpperCase(),
          side: data.side,
          size: data.size,
          entryPrice: fillPrice ?? data.price ?? '0',
          leverage: data.leverage,
          status: 'OPEN',
        },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'FILLED',
          filledSize: data.size,
          avgFillPrice: fillPrice ?? data.price ?? '0',
        },
      });
    }

    try {
      await xpEngine.award({
        userId,
        source: 'TRADE',
        amount: 40,
        description: `${data.side} ${data.symbol}`,
        metadata: { orderId: order.id, fillPrice },
      });
      await achievementService.tryUnlock(userId, 'FIRST_TRADE');
      await referralService.activate(userId);
    } catch (err) {
      console.error('[orders] post-trade side effects failed', err);
    }

    return {
      success: true,
      data: {
        order: { ...order, avgFillPrice: fillPrice },
        position,
        market: hlMeta,
        note:
          data.protocol === 'hyperliquid'
            ? 'Filled at HL mid for tracking. Live exchange execution requires agent wallet signing (not enabled on server).'
            : undefined,
      },
    };
  });
}
