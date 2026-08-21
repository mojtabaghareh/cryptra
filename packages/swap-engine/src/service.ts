import { randomUUID } from 'node:crypto';
import { prisma } from '@cryptra/database';
import { AppError, ErrorCodes } from '@cryptra/core';
import { feeCalculator } from '@cryptra/fees';
import { writeAuditLog, AuditActions, CircuitBreaker } from '@cryptra/security';
import { xpEngine } from '@cryptra/xp';
import { achievementService } from '@cryptra/achievements';
import { referralService } from '@cryptra/referral';
import type {
  ISwapAdapter,
  SwapQuoteRequest,
  SwapQuote,
  SwapExecuteRequest,
  SwapExecuteResult,
} from './types';

// In-memory quote cache (replace with Redis in production)
const quoteCache = new Map<string, SwapQuote & { adapterId: string; rawRoute: unknown }>();
const QUOTE_TTL_MS = 30_000; // 30 seconds

export class SwapService {
  private adapters = new Map<string, ISwapAdapter>();
  private circuitBreakers = new Map<string, CircuitBreaker>();

  registerAdapter(adapter: ISwapAdapter): void {
    this.adapters.set(adapter.id, adapter);
    this.circuitBreakers.set(
      adapter.id,
      new CircuitBreaker({ name: `swap:${adapter.id}`, failureThreshold: 3, timeoutMs: 20_000 }),
    );
  }

  listAdapters(): ISwapAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get the best quote across all available adapters.
   */
  async getQuote(req: SwapQuoteRequest): Promise<SwapQuote> {
    const slippageBps = req.slippageBps ?? 50;

    if (!req.fromAmount || Number(req.fromAmount) <= 0) {
      throw new AppError({
        code: ErrorCodes.VALIDATION_FAILED,
        message: 'fromAmount must be positive',
      });
    }

    const available: ISwapAdapter[] = [];
    for (const adapter of this.adapters.values()) {
      const ok = await adapter.isAvailable();
      if (ok && adapter.supportedChains.includes(req.fromChain)) {
        available.push(adapter);
      }
    }

    if (available.length === 0) {
      throw new AppError({
        code: ErrorCodes.SWAP_QUOTE_FAILED,
        message: 'No swap adapter available for this chain',
      });
    }

    // Try adapters in parallel, take the best toAmount
    const results = await Promise.allSettled(
      available.map(async (adapter) => {
        const breaker = this.circuitBreakers.get(adapter.id)!;
        return breaker.execute(async () => {
          const quote = await adapter.getQuote({
            fromToken: req.fromToken,
            toToken: req.toToken,
            fromAmount: req.fromAmount,
            fromChain: req.fromChain,
            toChain: req.toChain,
            slippageBps,
          });
          return { adapter, quote };
        });
      }),
    );

    const successful = results
      .filter((r): r is PromiseFulfilledResult<{ adapter: ISwapAdapter; quote: any }> => r.status === 'fulfilled')
      .map((r) => r.value);

    if (successful.length === 0) {
      throw new AppError({
        code: ErrorCodes.SWAP_QUOTE_FAILED,
        message: 'All swap adapters failed to provide a quote',
      });
    }

    // Choose highest toAmount
    successful.sort((a, b) => Number(b.quote.toAmount) - Number(a.quote.toAmount));
    const best = successful[0];

    // Calculate fee
    const fee = await feeCalculator.calculate({
      userId: req.userId,
      amount: req.fromAmount,
    });

    const quoteId = randomUUID();
    const expiresAt = new Date(Date.now() + QUOTE_TTL_MS);

    const swapQuote: SwapQuote = {
      quoteId,
      fromToken: req.fromToken,
      toToken: req.toToken,
      fromAmount: req.fromAmount,
      toAmount: best.quote.toAmount,
      fromChain: req.fromChain,
      toChain: req.toChain,
      protocol: best.adapter.id,
      route: best.quote.route,
      feePercent: fee.feePercent,
      feeAmount: fee.feeAmount,
      priceImpactBps: best.quote.priceImpactBps,
      estimatedGas: best.quote.estimatedGas,
      expiresAt,
    };

    quoteCache.set(quoteId, {
      ...swapQuote,
      adapterId: best.adapter.id,
      rawRoute: best.quote.route,
    });

    // Persist as PENDING
    await prisma.swap.create({
      data: {
        id: quoteId,
        userId: req.userId,
        fromToken: req.fromToken,
        toToken: req.toToken,
        fromAmount: req.fromAmount,
        toAmount: best.quote.toAmount,
        fromChain: req.fromChain,
        toChain: req.toChain,
        protocol: best.adapter.id,
        route: best.quote.route as any,
        status: 'QUOTED',
        feeAmount: fee.feeAmount,
        feePercent: fee.feePercent,
        slippageBps,
        quotedAt: new Date(),
      },
    });

    return swapQuote;
  }

  /**
   * Mark a quote as submitted / confirmed after user signs the tx.
   */
  async execute(req: SwapExecuteRequest): Promise<SwapExecuteResult> {
    const cached = quoteCache.get(req.quoteId);
    const swap = await prisma.swap.findUnique({ where: { id: req.quoteId } });

    if (!swap || swap.userId !== req.userId) {
      throw new AppError({
        code: ErrorCodes.NOT_FOUND,
        message: 'Quote not found',
      });
    }

    if (swap.status !== 'QUOTED' && swap.status !== 'PENDING') {
      throw new AppError({
        code: ErrorCodes.CONFLICT,
        message: `Swap already in status ${swap.status}`,
      });
    }

    if (cached && cached.expiresAt < new Date()) {
      await prisma.swap.update({
        where: { id: req.quoteId },
        data: { status: 'FAILED', errorMessage: 'Quote expired' },
      });
      throw new AppError({
        code: ErrorCodes.SWAP_QUOTE_EXPIRED,
        message: 'Quote has expired, please request a new one',
      });
    }

    const txHash = req.txHash;

    await prisma.swap.update({
      where: { id: req.quoteId },
      data: {
        status: txHash ? 'SUBMITTED' : 'SUBMITTED',
        txHash: txHash ?? null,
        submittedAt: new Date(),
      },
    });

    await writeAuditLog({
      userId: req.userId,
      action: AuditActions.SWAP_EXECUTE,
      resource: 'swap',
      resourceId: req.quoteId,
      metadata: { txHash, protocol: swap.protocol },
    });

    // Award XP + achievements (fire and forget style)
    try {
      await xpEngine.award({
        userId: req.userId,
        source: 'SWAP',
        amount: 25,
        description: 'Swap executed',
        metadata: { swapId: req.quoteId },
      });

      await achievementService.tryUnlock(req.userId, 'FIRST_SWAP');
      await referralService.activate(req.userId);
    } catch (err) {
      console.error('[SwapService] post-execute side effects failed', err);
    }

    quoteCache.delete(req.quoteId);

    return {
      swapId: req.quoteId,
      status: 'SUBMITTED',
      txHash,
    };
  }

  async getSwap(swapId: string, userId: string) {
    const swap = await prisma.swap.findFirst({
      where: { id: swapId, userId },
    });
    if (!swap) {
      throw new AppError({ code: ErrorCodes.NOT_FOUND, message: 'Swap not found' });
    }
    return swap;
  }

  async listSwaps(userId: string, limit = 20) {
    return prisma.swap.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const swapService = new SwapService();
