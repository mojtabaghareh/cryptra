// ============================================================
// ReplayGenerator.ts
// تولید گزارش هفتگی رفتار کاربر از روی تحلیل‌های Reflection
// ============================================================

import { ReflectionResult, BehaviorPattern } from '../reflection-engine/ReflectionEngine';

export interface WeeklyReplay {
  userId: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  totalEvents: number;
  insights: string[];
  patterns: ReflectionResult[];
  summary: string;
}

export class ReplayGenerator {
  /**
   * تولید گزارش هفتگی بر اساس تحلیل‌های رفتاری
   */
  generateReplay(userId: string, patterns: ReflectionResult[], weekNumber: number): WeeklyReplay {
    const insights = this.generateInsights(patterns);
    const summary = this.generateSummary(patterns);

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    return {
      userId,
      weekNumber,
      startDate: startOfWeek.toISOString(),
      endDate: now.toISOString(),
      totalEvents: patterns.reduce((sum, p) => sum + p.triggeredEvents.length, 0),
      insights,
      patterns,
      summary,
    };
  }

  /**
   * تولید بینش‌های متنی از الگوهای شناسایی‌شده
   */
  private generateInsights(patterns: ReflectionResult[]): string[] {
    const insights: string[] = [];

    for (const pattern of patterns) {
      switch (pattern.pattern) {
        case 'FOMO':
          insights.push('⚠️ این هفته در زمان افزایش قیمت، معاملات خرید انجام داده‌اید. این می‌تواند نشانه‌ی FOMO باشد.');
          break;
        case 'PANIC_SELL':
          insights.push('⚠️ این هفته چندین بار در زمان کاهش قیمت، فروش داشته‌اید. سعی کنید در شرایط افت بازار، آرامش خود را حفظ کنید.');
          break;
        case 'OVER_TRADING':
          insights.push('⚠️ تعداد معاملات شما در این هفته بالا بوده است. گاهی بهترین تصمیم، تصمیم به انجام ندادن معامله است.');
          break;
      }
    }

    if (insights.length === 0) {
      insights.push('✅ این هفته الگوی رفتاری خاصی شناسایی نشد. عالی کار کرده‌اید!');
    }

    return insights;
  }

  /**
   * تولید یک خلاصه‌ی متنی از وضعیت رفتاری کاربر
   */
  private generateSummary(patterns: ReflectionResult[]): string {
    if (patterns.length === 0) {
      return 'این هفته هیچ الگوی رفتاری تکراری در معاملات شما شناسایی نشد. به همین روال ادامه دهید!';
    }

    const patternNames = patterns.map(p => p.pattern).join('، ');
    return `این هفته الگوهایی مانند ${patternNames} در رفتار شما مشاهده شد. آگاهی از این الگوها اولین قدم برای بهبود کیفیت تصمیم‌گیری‌های شماست.`;
  }
}
