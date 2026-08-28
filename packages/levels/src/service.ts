import { prisma } from '@cryptra/database';
import {
  LEVEL_THRESHOLDS,
  calculateLevel,
  progressToNextLevel,
  xpForNextLevel,
} from './pure';

export {
  LEVEL_THRESHOLDS,
  calculateLevel,
  progressToNextLevel,
  xpForNextLevel,
} from './pure';

export interface SyncLevelResult {
  previousLevel: number;
  newLevel: number;
  leveledUp: boolean;
}

export class LevelService {
  async syncLevel(userId: string, currentXp?: number): Promise<SyncLevelResult> {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { xp: true, level: true },
    });

    const xp = currentXp ?? user.xp;
    const newLevel = calculateLevel(xp);
    const previousLevel = user.level;
    const leveledUp = newLevel > previousLevel;

    if (newLevel !== previousLevel) {
      const feeTier = Math.min(5, Math.max(0, newLevel - 1));

      await prisma.user.update({
        where: { id: userId },
        data: {
          level: newLevel,
          feeTier,
        },
      });
    }

    return {
      previousLevel,
      newLevel,
      leveledUp,
    };
  }

  getProgress(xp: number, level: number) {
    return progressToNextLevel(xp, level);
  }
}

export const levelService = new LevelService();
