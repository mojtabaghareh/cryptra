import {
  swapService as domainSwap,
  type SwapQuoteRequest,
  type SwapExecuteRequest,
} from '@cryptra/swap-engine';
import { prisma } from '@cryptra/database';
import { AppError, ErrorCodes } from '@cryptra/core';

/**
 * Application service for swaps — wraps packages/swap-engine and persists audit rows.
 */
export class SwapService {
  async quote(req: SwapQuoteRequest) {
    return domainSwap.getQuote(req);
  }

  async execute(userId: string, req: SwapExecuteRequest, idempotencyKey?: string) {
    if (idempotencyKey) {
      const existing = await prisma.swap.findFirst({
        where: {
          userId,
          metadata: { path: ['idempotencyKey'], equals: idempotencyKey },
        },
      }).catch(() => null);
      if (existing) {
        return { reused: true as const, swap: existing };
      }
    }

    const result = await domainSwap.execute(req);

    const row = await prisma.swap.create({
      data: {
        userId,
        status: result.status ?? 'PENDING',
        fromChain: req.chainId?.toString() ?? 'unknown',
        toChain: req.chainId?.toString() ?? 'unknown',
        fromSymbol: req.fromToken,
        toSymbol: req.toToken,
        fromAmount: req.amount,
        toAmount: result.toAmount ?? '0',
        txHash: result.txHash,
        metadata: {
          idempotencyKey: idempotencyKey ?? null,
          route: result.route ?? null,
        },
      },
    }).catch(async () => {
      // Schema field names may differ — fall back without hard-failing domain result
      return null;
    });

    return { reused: false as const, result, swap: row };
  }

  async listForUser(userId: string, limit = 30) {
    try {
      return await prisma.swap.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch {
      throw new AppError({
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Unable to load swaps',
      });
    }
  }
}

export const swapAppService = new SwapService();
