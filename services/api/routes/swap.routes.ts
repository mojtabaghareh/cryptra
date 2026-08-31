import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  swapService,
  ALL_SWAP_ADAPTERS,
  jupiterAdapter,
  oneInchAdapter,
  uniswapAdapter,
  pancakeSwapAdapter,
  kyberAdapter,
  stonfiAdapter,
} from '@cryptra/swap-engine';
import { requireAuth } from '../middleware/auth';
import { AppError, ErrorCodes } from '@cryptra/core';
import { prisma } from '@cryptra/database';
import {
  claimIdempotencyKey,
  completeIdempotencyKey,
  releaseIdempotencyKey,
} from '@cryptra/security';

// Register every adapter once (idempotent if already registered)
for (const a of ALL_SWAP_ADAPTERS) {
  swapService.registerAdapter(a);
}

const adapterById = new Map(
  [
    jupiterAdapter,
    oneInchAdapter,
    uniswapAdapter,
    pancakeSwapAdapter,
    kyberAdapter,
    stonfiAdapter,
  ].map((a) => [a.id, a]),
);

export async function swapRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/protocols', async () => ({
    success: true,
    data: ALL_SWAP_ADAPTERS.map((a) => ({
      id: a.id,
      name: a.name,
      chains: a.supportedChains,
    })),
  }));

  app.post('/quote', async (request) => {
    const body = z
      .object({
        fromToken: z.string().min(1),
        toToken: z.string().min(1),
        fromAmount: z.string().min(1),
        fromChain: z.string().min(1),
        toChain: z.string().min(1),
        slippageBps: z.number().int().min(1).max(5000).optional(),
        preferredProtocol: z.string().optional(),
      })
      .safeParse(request.body);

    if (!body.success) {
      throw new AppError({
        code: ErrorCodes.VALIDATION_FAILED,
        message: 'Invalid quote request',
        details: { issues: body.error.issues },
      });
    }

    const userId = request.user!.userId;
    const quote = await swapService.getQuote({
      userId,
      ...body.data,
    });

    return { success: true, data: quote };
  });

  app.post('/build', async (request) => {
    const body = z
      .object({
        quoteId: z.string().min(1),
        userAddress: z.string().min(8),
      })
      .safeParse(request.body);

    if (!body.success) {
      throw new AppError({
        code: ErrorCodes.VALIDATION_FAILED,
        message: 'quoteId and userAddress required',
      });
    }

    const swap = await prisma.swap.findFirst({
      where: { id: body.data.quoteId, userId: request.user!.userId },
    });

    if (!swap) {
      throw new AppError({ code: ErrorCodes.NOT_FOUND, message: 'Quote not found' });
    }

    if (swap.status !== 'QUOTED' && swap.status !== 'PENDING') {
      throw new AppError({
        code: ErrorCodes.CONFLICT,
        message: `Cannot build tx for status ${swap.status}`,
      });
    }

    const protocol = (swap.protocol ?? '').toLowerCase();
    const adapter = adapterById.get(protocol) ?? adapterById.get(protocol.replace('oneinch', '1inch'));

    if (!adapter?.buildTransaction) {
      throw new AppError({
        code: ErrorCodes.SWAP_QUOTE_FAILED,
        message: `Adapter ${protocol} does not support buildTransaction`,
      });
    }

    let built: unknown;

    if (protocol === '1inch' || protocol === 'oneinch') {
      built = await oneInchAdapter.buildTransaction!({
        quote: swap.route,
        userAddress: body.data.userAddress,
        fromToken: swap.fromToken,
        toToken: swap.toToken,
        fromAmount: swap.fromAmount,
        fromChain: swap.fromChain,
        slippageBps: swap.slippageBps ?? 50,
      } as never);
    } else {
      built = await adapter.buildTransaction({
        quote: swap.route,
        userAddress: body.data.userAddress,
      });
    }

    return {
      success: true,
      data: {
        quoteId: swap.id,
        protocol,
        chain: swap.fromChain,
        transaction: built,
      },
    };
  });

  app.post('/execute', async (request) => {
    const body = z
      .object({
        quoteId: z.string().min(1),
        txHash: z.string().optional(),
        idempotencyKey: z.string().min(8).max(128).optional(),
      })
      .safeParse(request.body);

    if (!body.success) {
      throw new AppError({
        code: ErrorCodes.VALIDATION_FAILED,
        message: 'quoteId is required',
      });
    }

    const userId = request.user!.userId;
    const scope = `swap:execute:${userId}`;
    const idemKey = body.data.idempotencyKey;

    if (idemKey) {
      const claim = await claimIdempotencyKey(scope, idemKey);
      if (claim.status === 'replay') {
        try {
          return JSON.parse(claim.body) as { success: boolean; data: unknown };
        } catch {
          throw new AppError({
            code: ErrorCodes.CONFLICT,
            message: 'Duplicate request (idempotency replay)',
          });
        }
      }
      if (claim.status === 'in_progress') {
        throw new AppError({
          code: ErrorCodes.CONFLICT,
          message: 'Request already in progress',
        });
      }

      try {
        const result = await swapService.execute({
          userId,
          quoteId: body.data.quoteId,
          txHash: body.data.txHash,
        });
        const payload = { success: true as const, data: result };
        if (claim.status === 'acquired') {
          await completeIdempotencyKey(scope, idemKey, JSON.stringify(payload));
        }
        return payload;
      } catch (err) {
        if (claim.status === 'acquired') {
          await releaseIdempotencyKey(scope, idemKey);
        }
        throw err;
      }
    }

    const result = await swapService.execute({
      userId,
      quoteId: body.data.quoteId,
      txHash: body.data.txHash,
    });

    return { success: true, data: result };
  });

  app.get('/', async (request) => {
    const swaps = await swapService.listSwaps(request.user!.userId);
    return { success: true, data: swaps };
  });

  app.get<{ Params: { id: string } }>('/:id', async (request) => {
    const swap = await swapService.getSwap(request.params.id, request.user!.userId);
    return { success: true, data: swap };
  });
}
