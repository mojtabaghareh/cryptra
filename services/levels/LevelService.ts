import { levelService as domain, calculateLevel, LEVEL_THRESHOLDS } from '@cryptra/levels';
import { prisma } from '@cryptra/database';
import { AppError, ErrorCodes } from '@cryptra/core';

export class LevelsAppService {
  thresholds() {
    return LEVEL_THRESHOLDS;
  }

  async profile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true, feeTier: true },
    });
    if (!user) {
      throw new AppError({ code: ErrorCodes.NOT_FOUND, message: 'User not found' });
    }
    return {
      ...user,
      computedLevel: calculateLevel(user.xp),
      progress: domain.getProgress(user.xp, user.level),
    };
  }

  async sync(userId: string) {
    return domain.syncLevel(userId);
  }
}

export const levelsAppService = new LevelsAppService();
