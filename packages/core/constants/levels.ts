import type { FeeTierId } from './fees';

/**
 * Central Level configuration (§14). Backend (packages/levels) is the only
 * authority that promotes a user's level — this table must not be
 * re-implemented in Frontend or any other backend service.
 */
export interface LevelConfig {
  level: number;
  minXp: number;
  feeTierId: FeeTierId;
  badge: string;
}

export const LEVELS: readonly LevelConfig[] = [
  { level: 1, minXp: 0, feeTierId: 1, badge: 'newcomer' },
  { level: 2, minXp: 500, feeTierId: 1, badge: 'newcomer' },
  { level: 3, minXp: 1_500, feeTierId: 2, badge: 'apprentice' },
  { level: 4, minXp: 3_500, feeTierId: 2, badge: 'apprentice' },
  { level: 5, minXp: 7_500, feeTierId: 3, badge: 'trader' },
  { level: 6, minXp: 15_000, feeTierId: 3, badge: 'trader' },
  { level: 7, minXp: 30_000, feeTierId: 4, badge: 'strategist' },
  { level: 8, minXp: 60_000, feeTierId: 4, badge: 'strategist' },
  { level: 9, minXp: 120_000, feeTierId: 5, badge: 'veteran' },
  { level: 10, minXp: 250_000, feeTierId: 5, badge: 'veteran' },
  { level: 11, minXp: 500_000, feeTierId: 6, badge: 'master' },
] as const;

export const MAX_LEVEL = LEVELS[LEVELS.length - 1]!.level;

export function resolveLevelForXp(xp: number): LevelConfig {
  let current: LevelConfig = LEVELS[0]!;
  for (const level of LEVELS) {
    if (xp >= level.minXp) {
      current = level;
    } else {
      break;
    }
  }
  return current;
}

