// ============================================================
// DecisionEngine.ts - Core Decision & Behavior Engine
// ============================================================

export interface DecisionContext {
  userId: string;
  timestamp: number;
  type: 'buy' | 'sell' | 'swap' | 'hold';
  price: number;
  amount: number;
  chain: string;
  confidence: number;
}

export interface BehaviorPattern {
  type: 'FOMO' | 'PANIC' | 'REVENGE' | 'OVERTRADE' | 'DISCIPLINE';
  count: number;
  description: string;
  averageImpact: number; // درصد تأثیر بر سود/ضرر
}

export class DecisionEngine {
  private userHistory: Map<string, DecisionContext[]> = new Map();

  /**
   * ثبت یک تصمیم جدید برای کاربر
   */
  recordDecision(userId: string, context: DecisionContext) {
    const history = this.userHistory.get(userId) || [];
    history.push(context);
    this.userHistory.set(userId, history);
  }

  /**
   * تحلیل الگوهای رفتاری بر اساس تاریخچه تصمیم‌ها
   */
  analyzeBehavior(userId: string): BehaviorPattern[] {
    const history = this.userHistory.get(userId) || [];
    if (history.length < 5) return [];

    const patterns: BehaviorPattern[] = [];

    // تحلیل FOMO (خرید در اوج)
    const fomoCount = history.filter((d, i) => {
      if (i === 0) return false;
      return d.type === 'buy' && d.price > history[i - 1].price * 1.02;
    }).length;
    if (fomoCount > 2) {
      patterns.push({
        type: 'FOMO',
        count: fomoCount,
        description: 'تمایل به خرید در زمان افزایش شدید قیمت',
        averageImpact: -0.05,
      });
    }

    // تحلیل Panic Sell (فروش در افت)
    const panicCount = history.filter((d, i) => {
      if (i === 0) return false;
      return d.type === 'sell' && d.price < history[i - 1].price * 0.98;
    }).length;
    if (panicCount > 2) {
      patterns.push({
        type: 'PANIC',
        count: panicCount,
        description: 'تمایل به فروش در زمان کاهش شدید قیمت',
        averageImpact: -0.08,
      });
    }

    // تحلیل Revenge Trading (معامله انتقامی پس از ضرر)
    const revengeCount = history.filter((d, i) => {
      if (i < 2) return false;
      return d.confidence < 0.5 && d.amount > history[i - 1].amount * 1.5;
    }).length;
    if (revengeCount > 1) {
      patterns.push({
        type: 'REVENGE',
        count: revengeCount,
        description: 'افزایش حجم معامله پس از یک ضرر',
        averageImpact: -0.12,
      });
    }

    return patterns;
  }

  /**
   * تولید امتیاز هوش تصمیم‌گیری (Decision Score)
   */
  calculateDecisionScore(userId: string): number {
    const history = this.userHistory.get(userId) || [];
    if (history.length === 0) return 50; // امتیاز پایه

    // معیارهای ساده:
    // 1. تعداد تصمیم‌های هیجانی (کمتر بهتر است)
    const emotionalTrades = history.filter(d => d.confidence < 0.4).length;
    // 2. میانگین اطمینان تصمیم‌ها
    const avgConfidence = history.reduce((sum, d) => sum + d.confidence, 0) / history.length;

    let score = 50;
    score -= emotionalTrades * 2;
    score += avgConfidence * 20;

    return Math.max(0, Math.min(100, Math.round(score)));
  }
}
