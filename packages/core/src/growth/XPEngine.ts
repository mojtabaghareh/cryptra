// packages/core/src/growth/XPEngine.ts

export class XPEngine {
  private levelThresholds = [0, 100, 250, 500, 1000, 2000];

  calculateXP(score: number, decisionsCount: number): number {
    return decisionsCount * 10 + score;
  }

  getLevel(xp: number): { level: number; nextLevelXP: number } {
    let level = 0;
    for (let i = 0; i < this.levelThresholds.length; i++) {
      if (xp >= this.levelThresholds[i]) {
        level = i;
      } else {
        break;
      }
    }
    const nextLevelXP = this.levelThresholds[level + 1] || Infinity;
    return { level, nextLevelXP };
  }
}