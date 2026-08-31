import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@cryptra/database';
import { requireAuth } from '../middleware/auth';
import { AppError, ErrorCodes } from '@cryptra/core';
import { xpEngine } from '@cryptra/xp';
import { achievementService } from '@cryptra/achievements';
import { referralService } from '@cryptra/referral';
import { hyperliquidClient, placeMarketOrder, isAgentConfigured } from '@cryptra/hyperliquid';
import {
  placeDydxOrder,
  isDydxAgentConfigured,
  placeGmxOrder,
  isGmxAgentConfigured,
  placeDriftOrder,
  isDriftAgentConfigured,
} from '@cryptra/perp-engine';
import {
  claimIdempotencyKey,
  completeIdempotencyKey,
  releaseIdempotencyKey,
} from '@cryptra/security';

const placeOrderSchema = z.object({
  protocol: z.string().default('hyperliquid'),
  symbol: z.string().min(1),
  side: z.enum(['LONG', 'SHORT']),
  type: z.enum(['MARKET', 'LIMIT', 'STOP_MARKET', 'STOP_LIMIT']).default('MARKET'),
  size: z.string().min(1),
  price: z.string().optional(),
  stopPrice: z.string().optional(),
  leverage: z.number().int().min(1).max(50).default(1),
  idempotencyKey: z.string().min(8).max(128).optional(),
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

  app.get('/venues', async () => ({
    success: true,
    data: [
      { id: 'hyperliquid', live: isAgentConfigured(), signing: 'L1 EIP-712 phantom agent' },
      { id: 'dydx', live: isDydxAgentConfigured(), signing: 'dYdX Chain LocalWallet (v4-client-js)' },
      { id: 'gmx', live: isGmxAgentConfigured(), signing: 'Arbitrum ethers agent key' },
      { id: 'drift', live: isDriftAgentConfigured(), signing: 'Solana keypair + Drift SDK' },
    ],
  }));

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
    const scope = `order:place:${userId}`;
    const idemKey = data.idempotencyKey;

    if (idemKey) {
      const claim = await claimIdempotencyKey(scope, idemKey);
      if (claim.status === 'replay') {
        try {
          return JSON.parse(claim.body);
        } catch {
          throw new AppError({ code: ErrorCodes.CONFLICT, message: 'Duplicate order request' });
        }
      }
      if (claim.status === 'in_progress') {
        throw new AppError({ code: ErrorCodes.CONFLICT, message: 'Order already in progress' });
      }

      try {
        const payload = await placeOrderCore(userId, data);
        if (claim.status === 'acquired') {
          await completeIdempotencyKey(scope, idemKey, JSON.stringify(payload));
        }
        return payload;
      } catch (e) {
        if (claim.status === 'acquired') await releaseIdempotencyKey(scope, idemKey);
        throw e;
      }
    }

    return placeOrderCore(userId, data);
  });
}

async function dispatchVenue(data: z.infer<typeof placeOrderSchema>) {
  const protocol = data.protocol.toLowerCase();
  const isBuy = data.side === 'LONG';

  if (protocol === 'hyperliquid') {
    const agentResult = await placeMarketOrder({
      symbol: data.symbol,
      isBuy,
      size: data.size,
      leverage: data.leverage,
    });
    return {
      fillPrice: agentResult.mid != null ? String(agentResult.mid) : data.price,
      meta: {
        source: agentResult.mode,
        mid: agentResult.mid,
        agent: isAgentConfigured() ? 'configured' : 'off',
      },
      agent: {
        mode: agentResult.mode,
        executed: agentResult.executed,
        message: agentResult.message,
        externalId: undefined as string | undefined,
      },
    };
  }

  if (protocol === 'dydx') {
    const r = await placeDydxOrder({
      symbol: data.symbol,
      isBuy,
      size: data.size,
      price: data.price,
      leverage: data.leverage,
      type: data.type === 'LIMIT' ? 'LIMIT' : 'MARKET',
    });
    return {
      fillPrice: r.mid != null ? String(r.mid) : data.price,
      meta: { source: r.mode, mid: r.mid, agent: isDydxAgentConfigured() ? 'configured' : 'off' },
      agent: {
        mode: r.mode,
        executed: r.executed,
        message: r.message,
        externalId: r.externalId,
      },
    };
  }

  if (protocol === 'gmx') {
    const r = await placeGmxOrder({
      symbol: data.symbol,
      isBuy,
      size: data.size,
      leverage: data.leverage,
    });
    return {
      fillPrice: r.mid != null ? String(r.mid) : data.price,
      meta: { source: r.mode, mid: r.mid, agent: isGmxAgentConfigured() ? 'configured' : 'off' },
      agent: {
        mode: r.mode,
        executed: r.executed,
        message: r.message,
        externalId: r.externalId,
      },
    };
  }

  if (protocol === 'drift') {
    const r = await placeDriftOrder({
      symbol: data.symbol,
      isBuy,
      size: data.size,
      leverage: data.leverage,
    });
    return {
      fillPrice: r.mid != null ? String(r.mid) : data.price,
      meta: { source: r.mode, mid: r.mid, agent: isDriftAgentConfigured() ? 'configured' : 'off' },
      agent: {
        mode: r.mode,
        executed: r.executed,
        message: r.message,
        externalId: r.externalId,
      },
    };
  }

  throw new AppError({
    code: ErrorCodes.VALIDATION_FAILED,
    message: `Unknown protocol: ${data.protocol}. Use hyperliquid|dydx|gmx|drift`,
  });
}

async function placeOrderCore(
  userId: string,
  data: z.infer<typeof placeOrderSchema>,
) {
  let fillPrice = data.price;
  let hlMeta: { source: string; mid?: number; agent?: string } | null = null;
  let agentInfo: {
    mode: string;
    executed: boolean;
    message: string;
    externalId?: string;
  } | null = null;

  if (data.type === 'MARKET') {
    try {
      const dispatched = await dispatchVenue(data);
      if (dispatched.fillPrice) fillPrice = dispatched.fillPrice;
      hlMeta = dispatched.meta;
      agentInfo = dispatched.agent;
    } catch (e) {
      if (e instanceof AppError) throw e;
      hlMeta = { source: 'error', agent: 'off' };
      agentInfo = {
        mode: 'skipped',
        executed: false,
        message: e instanceof Error ? e.message : 'venue dispatch failed',
      };
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
      externalId: agentInfo?.externalId,
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
        status: agentInfo?.executed ? 'FILLED' : 'OPEN',
        filledSize: agentInfo?.executed ? data.size : undefined,
        avgFillPrice: fillPrice ?? data.price ?? '0',
      },
    });
  }

  try {
    await xpEngine.award({
      userId,
      source: 'TRADE',
      amount: 40,
      description: `${data.side} ${data.symbol} @ ${data.protocol}`,
      metadata: { orderId: order.id, fillPrice, mode: agentInfo?.mode },
    });
    await achievementService.tryUnlock(userId, 'FIRST_TRADE');
    await referralService.activate(userId);
  } catch {
    /* ignore */
  }

  return {
    success: true as const,
    data: {
      order: { ...order, avgFillPrice: fillPrice },
      position,
      market: hlMeta,
      agent: agentInfo,
      note: agentInfo?.message,
    },
  };
}
