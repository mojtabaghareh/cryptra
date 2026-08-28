import { prisma } from '@cryptra/database';

export class RewardService {
  async list(userId: string) {
    try {
      return await prisma.userReward.findMany({
        where: { userId },
        orderBy: { claimedAt: 'desc' },
        take: 50,
        include: { reward: true },
      });
    } catch {
      return [];
    }
  }
}

export const rewardService = new RewardService();
