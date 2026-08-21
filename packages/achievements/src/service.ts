import { prisma } from '@cryptra/database';
import { xpEngine } from '@cryptra/xp';

export interface UnlockResult {
  unlocked: boolean;
  achievementCode?: string;
  xpAwarded?: number;
}

export class AchievementService {
  /**
   * Try to unlock an achievement for a user.
   * Safe to call multiple times — will not double-award.
   */
  async tryUnlock(userId: string, achievementCode: string): Promise<UnlockResult> {
    const achievement = await prisma.achievement.findUnique({
      where: { code: achievementCode },
    });

    if (!achievement || !achievement.isActive) {
      return { unlocked: false };
    }

    const existing = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    });

    if (existing) {
      return { unlocked: false };
    }

    await prisma.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id,
      },
    });

    let xpAwarded = 0;
    if (achievement.xpReward > 0) {
      const result = await xpEngine.award({
        userId,
        source: 'ACHIEVEMENT',
        amount: achievement.xpReward,
        description: `Achievement unlocked: ${achievement.name}`,
        metadata: { achievementCode },
      });
      xpAwarded = result.awarded;
    }

    return {
      unlocked: true,
      achievementCode,
      xpAwarded,
    };
  }

  async listForUser(userId: string) {
    const all = await prisma.achievement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    const unlocked = await prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true, unlockedAt: true },
    });

    const unlockedMap = new Map(
      unlocked.map((u) => [u.achievementId, u.unlockedAt]),
    );

    return all.map((a) => ({
      ...a,
      unlocked: unlockedMap.has(a.id),
      unlockedAt: unlockedMap.get(a.id) ?? null,
    }));
  }

  /**
   * Seed default achievements.
   */
  async seedDefaults(): Promise<void> {
    const defaults = [
      {
        code: 'FIRST_LOGIN',
        name: 'First Steps',
        description: 'Logged in for the first time',
        xpReward: 20,
        icon: 'footprints',
      },
      {
        code: 'FIRST_SWAP',
        name: 'Swap Starter',
        description: 'Completed your first swap',
        xpReward: 50,
        icon: 'repeat',
      },
      {
        code: 'FIRST_TRADE',
        name: 'Trader',
        description: 'Opened your first perpetual position',
        xpReward: 75,
        icon: 'trending-up',
      },
      {
        code: 'REFERRAL_1',
        name: 'Inviter',
        description: 'Successfully referred 1 friend',
        xpReward: 100,
        icon: 'users',
      },
      {
        code: 'REFERRAL_5',
        name: 'Networker',
        description: 'Successfully referred 5 friends',
        xpReward: 300,
        icon: 'network',
      },
      {
        code: 'LEVEL_5',
        name: 'Rising Star',
        description: 'Reached level 5',
        xpReward: 150,
        icon: 'star',
      },
      {
        code: 'LEVEL_10',
        name: 'Veteran',
        description: 'Reached level 10',
        xpReward: 500,
        icon: 'award',
      },
    ];

    for (const a of defaults) {
      await prisma.achievement.upsert({
        where: { code: a.code },
        create: a,
        update: {
          name: a.name,
          description: a.description,
          xpReward: a.xpReward,
          icon: a.icon,
        },
      });
    }
  }
}

export const achievementService = new AchievementService();
