import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { swapService, jupiterAdapter, oneInchAdapter } from '@cryptra/swap-engine';
import { requireAuth } from '../middleware/auth';
import { AppError, ErrorCodes } from '@cryptra/core';

// Register adapters once
swapService.registerAdapter(jupiterAdapter);
swapService.registerAdapter(oneInchAdapter);

export async function swapRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  /**
   * POST /api/v1/swaps/quote
   */
  app.post('/quote', async (request) => {
    const body = z
      .object({
        fromToken: z.string().min(1),
        toToken: z.string().min(1),
        fromAmount: z.string().min(1),
        fromChain: z.string().min(1),
        toChain: z.string().min(1),
        slippageBps: z.number().int().min(1).max(5000).optional(),
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

  /**
   * POST /api/v1/swaps/execute
   */
  app.post('/execute', async (request) => {
    const body = z
      .object({
        quoteId: z.string().min(1),
        txHash: z.string().optional(),
      })
      .safeParse(request.body);

    if (!body.success) {
      throw new AppError({
        code: ErrorCodes.VALIDATION_FAILED,
        message: 'quoteId is required',
      });
    }

    const result = await swapService.execute({
      userId: request.user!.userId,
      quoteId: body.data.quoteId,
      txHash: body.data.txHash,
    });

    return { success: true, data: result };
  });

  /**
   * GET /api/v1/swaps
   */
  app.get('/', async (request) => {
    const swaps = await swapService.listSwaps(request.user!.userId);
    return { success: true, data: swaps };
  });

  /**
   * GET /api/v1/swaps/:id
   */
  app.get<{ Params: { id: string } }>('/:id', async (request) => {
    const swap = await swapService.getSwap(request.params.id, request.user!.userId);
    return { success: true, data: swap };
  });
}
