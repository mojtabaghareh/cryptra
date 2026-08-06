// ============================================================
// XPEngine.ts - Core XP, Level & Reward Engine
// ============================================================

export enum Level {
  BRONZE = 'Bronze',
  SILVER = 'Silver',
  GOLD = 'Gold',
  PLATINUM = 'Platinum',
  DIAMOND = 'Diamond',
}

export interface UserProgress {
  userId: string;
  xp: number;
  level: Level;
  badges: string[];
  achievements: string[];
  unlockableThemes: string[];
  feeDiscount: number; // درصد تخفیف کارمزد (مثلاً 0.12 -> 0.10)
}

export class XPEngine {
  // نقشه‌ی سطوح و XP مورد نیاز
  private readonly levelMap: Record<Level, number> = {
    [Level.BRONZE]: 0,
    [Level.SILVER]: 1000,
    [Level.GOLD]: 2500,
    [Level.PLATINUM]: 5000,
    [Level.DIAMOND]: 10000,
  };

  // تخفیف کارمزد بر اساس سطح
  private readonly feeDiscountMap: Record<Level, number> = {
    [Level.BRONZE]: 0.00,
    [Level.SILVER]: 0.01, // 1% تخفیف
    [Level.GOLD]: 0.02,   // 2% تخفیف
    [Level.PLATINUM]: 0.03,
    [Level.DIAMOND]: 0.05,
  };

  /**
   * محاسبه سطح کاربر بر اساس XP
   */
  calculateLevel(xp: number): Level {
    if (xp >= this.levelMap[Level.DIAMOND]) return Level.DIAMOND;
    if (xp >= this.levelMap[Level.PLATINUM]) return Level.PLATINUM;
    if (xp >= this.levelMap[Level.GOLD]) return Level.GOLD;
    if (xp >= this.levelMap[Level.SILVER]) return Level.SILVER;
    return Level.BRONZE;
  }

  /**
   * محاسبه تخفیف کارمزد بر اساس سطح
   */
  getFeeDiscount(level: Level): number {
    return this.feeDiscountMap[level] || 0.00;
  }

  /**
   * دریافت پاداش‌های قابل بازگشایی بر اساس سطح
   */
  getUnlockableThemes(level: Level): string[] {
    const themes: Record<Level, string[]> = {
      [Level.BRONZE]: ['Default Dark'],
      [Level.SILVER]: ['Default Dark', 'Electric Blue'],
      [Level.GOLD]: ['Default Dark', 'Electric Blue', 'Neon Night'],
      [Level.PLATINUM]: ['Default Dark', 'Electric Blue', 'Neon Night', 'Arctic Frost'],
      [Level.DIAMOND]: ['Default Dark', 'Electric Blue', 'Neon Night', 'Arctic Frost', 'Infinite Gold'],
    };
    return themes[level] || [];
  }

  /**
   * افزودن XP به کاربر
   */
  addXP(progress: UserProgress, amount: number): UserProgress {
    progress.xp += amount;
    const newLevel = this.calculateLevel(progress.xp);
    if (newLevel !== progress.level) {
      progress.level = newLevel;
      progress.feeDiscount = this.getFeeDiscount(newLevel);
      progress.unlockableThemes = this.getUnlockableThemes(newLevel);
    }
    return progress;
  }
}
