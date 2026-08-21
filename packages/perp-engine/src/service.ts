import { randomUUID } from 'node:crypto';
import { prisma } from '@cryptra/database';
import { AppError, ErrorCodes } from '@cryptra/core';
import { writeAuditLog, AuditActions, CircuitBreaker } from '@cryptra/security';
import { xpEngine } from '@cryptra/xp';
import { achievementService } from '@cryptra/achievements';
import { referralService } from '@cryptra/referral';
import type { IPerpAdapter, PlaceOrderRequest, PlaceOrderResult } from './types';

export class PerpService {
  private adapters = new Map<string, IPerpAdapter>();
  private breakers = new Map<string, CircuitBreaker>();

  registerAdapter(adapter: IPerpAdapter): void {
    this.adapters.set(adapter.id, adapter);
    this.breakers.set(
      adapter.id,
      new CircuitBreaker({ name: `perp:${adapter.id}`, failureThreshold: 3, timeoutMs: 15_000 }),
    );
  }

  getAdapter(protocol: string): IPerpAdapter {
    const adapter = this.adapters.get(protocol);
    if (!adapter) {
      throw new AppError({
        code: ErrorCodes.PERP_VENUE_UNAVAILABLE,
        message: `No perp adapter registered for protocol "${protocol}"`,
      });
    }
    return adapter;
  }

  async placeOrder(req: PlaceOrderRequest): Promise<PlaceOrderResult> {
    if (req.leverage < 1 || req.leverage > 50) {
      throw new AppError({
        code: ErrorCodes.PERP_LEVERAGE_INVALID,
        message: 'Leverage must be between 1 and 50',
      });
    }

    if (!req.size || Number(req.size) <= 0) {
      throw new AppError({
        code: ErrorCodes.VALIDATION_FAILED,
        message: 'Size must be positive',
      });
    }

    const adapter = this.getAdapter(req.protocol);
    const breaker = this.breakers.get(req.protocol)!;

    const orderId = randomUUID();

    // Create local order first
    await prisma.order.create({
      data: {
        id: orderId,
        userId: req.userId,
        protocol: req.protocol,
        symbol: req.symbol,
        side: req.side,
        type: req.type,
        size: req.size,
        price: req.price,
        stopPrice: req.stopPrice,
        leverage: req.leverage,
        status: 'OPEN',
      },
    });

    try {
      const result = await breaker.execute(() =>
        adapter.placeOrder({
          symbol: req.symbol,
          side: req.side,
          type: req.type,
          size: req.size,
          price: req.price,
          stopPrice: req.stopPrice,
          leverage: req.leverage,
        }),
      );

      await prisma.order.update({
        where: { id: orderId },
        data: {
          externalId: result.externalId,
          status: result.status === 'filled' ? 'FILLED' : 'OPEN',
        },
      });

      // If market order filled, create position
      if (result.status === 'filled' || req.type === 'MARKET') {
        await prisma.position.create({
          data: {
            userId: req.userId,
            orderId,
            protocol: req.protocol,
            symbol: req.symbol,
            side: req.side,
            size: req.size,
            entryPrice: req.price ?? '0',
            leverage: req.leverage,
            status: 'OPEN',
          },
        });
      }

      await writeAuditLog({
        userId: req.userId,
        action: AuditActions.ORDER_CREATE,
        resource: 'order',
        resourceId: orderId,
        metadata: { protocol: req.protocol, symbol: req.symbol, side: req.side },
      });

      // Side effects
      try {
        await xpEngine.award({
          userId: req.userId,
          source: 'TRADE',
          amount: 40,
          description: 'Perp order placed',
          metadata: { orderId },
        });
        await achievementService.tryUnlock(req.userId, 'FIRST_TRADE');
        await referralService.activate(req.userId);
      } catch (err) {
        console.error('[PerpService] side effects failed', err);
      }

      return {
        orderId,
        status: result.status,
        externalId: result.externalId,
      };
    } catch (error) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'REJECTED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw new AppError({
        code: ErrorCodes.PERP_ORDER_REJECTED,
        message: error instanceof Error ? error.message : 'Order rejected by venue',
        cause: error,
      });
    }
  }

  async cancelOrder(userId: string, orderId: string): Promise<void> {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new AppError({ code: ErrorCodes.NOT_FOUND, message: 'Order not found' });
    }

    if (order.status !== 'OPEN') {
      throw new AppError({
        code: ErrorCodes.CONFLICT,
        message: `Cannot cancel order in status ${order.status}`,
      });
    }

    const adapter = this.getAdapter(order.protocol);
    if (adapter.cancelOrder && order.externalId) {
      const breaker = this.breakers.get(order.protocol)!;
      await breaker.execute(() => adapter.cancelOrder!(order.externalId!));
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED', closedAt: new Date() },
    });

    await writeAuditLog({
      userId,
      action: AuditActions.ORDER_CANCEL,
      resource: 'order',
      resourceId: orderId,
    });
  }

  async listOrders(userId: string, limit = 30) {
    return prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async listPositions(userId: string) {
    return prisma.position.findMany({
      where: { userId, status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
    });
  }
}

export const perpService = new PerpService();
