import { prisma } from '@cryptra/database';

export class RewardService {
  async list(userId: string) {
    try {
      return await prisma.reward.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    } catch {
      return [];
    }
  }
}

export const rewardService = new RewardService();
