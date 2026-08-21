import { prisma } from '@cryptra/database';

/**
 * XP thresholds for each level.
 * Level 1 starts at 0 XP.
 */
export const LEVEL_THRESHOLDS = [
  0, // level 1
  100, // level 2
  300, // level 3
  700, // level 4
  1500, // level 5
  3000, // level 6
  6000, // level 7
  12000, // level 8
  25000, // level 9
  50000, // level 10
  100000, // level 11+
] as const;

export function calculateLevel(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

export function xpForNextLevel(currentLevel: number): number {
  const idx = currentLevel; // because thresholds[0] = level 1
  if (idx >= LEVEL_THRESHOLDS.length) {
    // Beyond defined levels: each extra level needs +50k
    return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + (currentLevel - LEVEL_THRESHOLDS.length + 1) * 50000;
  }
  return LEVEL_THRESHOLDS[idx];
}

export function progressToNextLevel(xp: number, level: number): {
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
} {
  const currentThreshold = LEVEL_THRESHOLDS[Math.min(level - 1, LEVEL_THRESHOLDS.length - 1)] ?? 0;
  const nextThreshold = xpForNextLevel(level);
  const range = nextThreshold - currentThreshold;
  const progress = Math.max(0, xp - currentThreshold);
  const percent = range > 0 ? Math.min(100, Math.floor((progress / range) * 100)) : 100;

  return {
    currentLevelXp: currentThreshold,
    nextLevelXp: nextThreshold,
    progressPercent: percent,
  };
}

export interface SyncLevelResult {
  previousLevel: number;
  newLevel: number;
  leveledUp: boolean;
}

export class LevelService {
  /**
   * Recalculate and persist the user's level based on current XP.
   * Also updates feeTier to match level (simple mapping).
   */
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
      // Map level → feeTier (0-5)
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
