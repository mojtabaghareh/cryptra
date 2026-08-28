import { describe, it, expect } from 'vitest';
import { calculateLevel, progressToNextLevel, LEVEL_THRESHOLDS } from './pure';

describe('levels pure math', () => {
  it('level 1 at 0 xp', () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it('advances with thresholds', () => {
    expect(calculateLevel(LEVEL_THRESHOLDS[1])).toBe(2);
    expect(calculateLevel(LEVEL_THRESHOLDS[2])).toBe(3);
  });

  it('progress is 0–100', () => {
    const p = progressToNextLevel(50, 1);
    expect(p.progressPercent).toBeGreaterThanOrEqual(0);
    expect(p.progressPercent).toBeLessThanOrEqual(100);
  });
});
