import { xpEngine, type AwardXpInput, type AwardXpResult } from '@cryptra/xp';
import { levelService } from '@cryptra/levels';
import { prisma } from '@cryptra/database';
import { AppError, ErrorCodes } from '@cryptra/core';

/**
 * Application service for XP — orchestrates domain engine + level sync.
 * HTTP layer lives in services/api/routes/xp.routes.ts
 */
export class XPService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, xp: true, level: true, feeTier: true },
    });
    if (!user) {
      throw new AppError({ code: ErrorCodes.NOT_FOUND, message: 'User not found' });
    }
    const progress = levelService.getProgress(user.xp, user.level);
    const bySource = await xpEngine.getTotalBySource(userId);
    return { ...user, progress, bySource };
  }

  async award(input: AwardXpInput): Promise<AwardXpResult> {
    return xpEngine.award(input);
  }

  async history(userId: string, limit = 50) {
    return xpEngine.getHistory(userId, limit);
  }
}

export const xpService = new XPService();
