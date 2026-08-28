import { hyperliquidClient } from '@cryptra/hyperliquid';
import { prisma } from '@cryptra/database';
import { AppError, ErrorCodes } from '@cryptra/core';

/**
 * Perps orchestration. Live order placement requires agent signing keys
 * (see packages/hyperliquid/agent.ts) — not fabricated here.
 */
export class PerpetualService {
  async markets() {
    return hyperliquidClient.getMajorPerps();
  }

  async clearinghouse(userAddress: string) {
    return hyperliquidClient.getClearinghouseState(userAddress);
  }

  async openPositionsDb(userId: string) {
    return prisma.position.findMany({
      where: { userId, status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
    });
  }

  async requireAddress(address?: string) {
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new AppError({
        code: ErrorCodes.VALIDATION_FAILED,
        message: 'Valid EVM address required',
      });
    }
    return address;
  }
}

export const perpetualService = new PerpetualService();
