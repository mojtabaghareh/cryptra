import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@cryptra/database';
import { requireAuth } from '../middleware/auth';
import { AppError, ErrorCodes } from '@cryptra/core';

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
    const order = await prisma.order.create({
      data: {
        userId: request.user!.userId,
        protocol: data.protocol,
        symbol: data.symbol,
        side: data.side,
        type: data.type,
        size: data.size,
        price: data.price,
        stopPrice: data.stopPrice,
        leverage: data.leverage,
        status: 'OPEN',
      },
    });

    // Market orders immediately open a position record (execution adapter fills later)
    let position = null;
    if (data.type === 'MARKET') {
      position = await prisma.position.create({
        data: {
          userId: request.user!.userId,
          orderId: order.id,
          protocol: data.protocol,
          symbol: data.symbol,
          side: data.side,
          size: data.size,
          entryPrice: data.price ?? '0',
          leverage: data.leverage,
          status: 'OPEN',
        },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'FILLED', filledSize: data.size, avgFillPrice: data.price ?? '0' },
      });
    }

    return { success: true, data: { order, position } };
  });
}
