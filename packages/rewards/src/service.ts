import { prisma, type RewardType } from '@cryptra/database';
import { AppError, ErrorCodes } from '@cryptra/core';
import { xpEngine } from '@cryptra/xp';

export class RewardService {
  /**
   * Claim a reward for a user (if not already claimed).
   */
  async claim(userId: string, rewardCode: string): Promise<{
    success: boolean;
    rewardName: string;
    type: RewardType;
  }> {
    const reward = await prisma.reward.findUnique({
      where: { code: rewardCode },
    });

    if (!reward || !reward.isActive) {
      throw new AppError({
        code: ErrorCodes.NOT_FOUND,
        message: 'Reward not found or inactive',
      });
    }

    const alreadyClaimed = await prisma.userReward.findFirst({
      where: { userId, rewardId: reward.id },
    });

    if (alreadyClaimed) {
      throw new AppError({
        code: ErrorCodes.CONFLICT,
        message: 'Reward already claimed',
      });
    }

    await prisma.userReward.create({
      data: {
        userId,
        rewardId: reward.id,
      },
    });

    // If the reward is XP type, award it
    if (reward.type === 'XP' && reward.value) {
      const amount = parseInt(reward.value, 10);
      if (!Number.isNaN(amount) && amount > 0) {
        await xpEngine.award({
          userId,
          source: 'OTHER',
          amount,
          description: `Reward claimed: ${reward.name}`,
          metadata: { rewardCode },
        });
      }
    }

    return {
      success: true,
      rewardName: reward.name,
      type: reward.type,
    };
  }

  async listAvailable(userId: string) {
    const allRewards = await prisma.reward.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    const claimed = await prisma.userReward.findMany({
      where: { userId },
      select: { rewardId: true },
    });
    const claimedIds = new Set(claimed.map((c) => c.rewardId));

    return allRewards.map((r) => ({
      ...r,
      claimed: claimedIds.has(r.id),
    }));
  }

  async listClaimed(userId: string) {
    return prisma.userReward.findMany({
      where: { userId },
      include: { reward: true },
      orderBy: { claimedAt: 'desc' },
    });
  }

  /**
   * Seed some default rewards (can be called once on startup or via admin).
   */
  async seedDefaults(): Promise<void> {
    const defaults = [
      {
        code: 'WELCOME_XP',
        type: 'XP' as RewardType,
        name: 'Welcome Bonus',
        description: 'Welcome to Cryptra! Here is some starter XP.',
        value: '100',
      },
      {
        code: 'FIRST_SWAP',
        type: 'XP' as RewardType,
        name: 'First Swap',
        description: 'Completed your first swap.',
        value: '50',
      },
      {
        code: 'FIRST_TRADE',
        type: 'XP' as RewardType,
        name: 'First Trade',
        description: 'Completed your first perpetual trade.',
        value: '75',
      },
    ];

    for (const r of defaults) {
      await prisma.reward.upsert({
        where: { code: r.code },
        create: r,
        update: {},
      });
    }
  }
}

export const rewardService = new RewardService();
