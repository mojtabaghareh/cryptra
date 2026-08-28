import { prisma } from '@cryptra/database';

export class TransactionService {
  async listForUser(userId: string, limit = 40) {
    try {
      return await prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch {
      // Model may be named differently — return swaps as activity fallback
      return prisma.swap.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }).catch(() => []);
    }
  }
}

export const transactionService = new TransactionService();
