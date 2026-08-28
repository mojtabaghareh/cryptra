import { prisma } from '@cryptra/database';
import { AppError, ErrorCodes } from '@cryptra/core';

export class PortfolioService {
  async summary(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError({ code: ErrorCodes.NOT_FOUND, message: 'User not found' });
    }

    const [wallets, openPositions, recentSwaps] = await Promise.all([
      prisma.wallet.findMany({ where: { userId } }).catch(() => []),
      prisma.position.findMany({ where: { userId, status: 'OPEN' } }).catch(() => []),
      prisma.swap.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }).catch(() => []),
    ]);

    return {
      userId,
      walletCount: wallets.length,
      openPositions: openPositions.length,
      recentSwaps,
      wallets: wallets.map((w) => ({
        id: w.id,
        chain: (w as { chain?: string }).chain ?? (w as { chainType?: string }).chainType,
        address: w.address,
      })),
    };
  }
}

export const portfolioService = new PortfolioService();
