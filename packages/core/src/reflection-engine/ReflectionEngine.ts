// ============================================================
// ReflectionEngine.ts
// موتور تحلیل رفتار مالی کاربر (بدون AI)
// این فایل قوانین روان‌شناسی رفتار را پیاده‌سازی می‌کند.
// ============================================================

import { FinancialEvent, EventType } from '../event-graph/models/EventTypes';
import { EventRepository } from '../event-graph/repository/EventRepository';

// تعریف انواع الگوهای رفتاری
export enum BehaviorPattern {
  FOMO = 'FOMO', // ترس از دست دادن فرصت
  PANIC_SELL = 'PANIC_SELL', // فروش هیجانی
  REVENGE_TRADE = 'REVENGE_TRADE', // معامله انتقامی
  OVER_TRADING = 'OVER_TRADING', // معامله بیش از حد
  HOLDING_DISCIPLINE = 'HOLDING_DISCIPLINE', // صبر در نگهداری
}

export interface ReflectionResult {
  pattern: BehaviorPattern;
  confidence: number; // درصد اطمینان (۰ تا ۱۰۰)
  description: string;
  triggeredEvents: FinancialEvent[];
}

export class ReflectionEngine {
  private repository: EventRepository;

  constructor(repository: EventRepository) {
    this.repository = repository;
  }

  /**
   * تحلیل رویدادهای یک کاربر برای یافتن الگوهای رفتاری
   */
  async analyzeUser(userId: string): Promise<ReflectionResult[]> {
    const events = await this.repository.getEventsByUserId(userId);
    const results: ReflectionResult[] = [];

    // ۱. بررسی الگوی FOMO
    const fomo = this.detectFomo(events);
    if (fomo) results.push(fomo);

    // ۲. بررسی الگوی Panic Sell
    const panic = this.detectPanicSell(events);
    if (panic) results.push(panic);

    // ۳. بررسی الگوی Revenge Trade
    const revenge = this.detectRevengeTrade(events);
    if (revenge) results.push(revenge);

    return results;
  }

  /**
   * تشخیص الگوی FOMO (خرید در اوج قیمت)
   */
  private detectFomo(events: FinancialEvent[]): ReflectionResult | null {
    // فقط معاملات خرید را فیلتر می‌کنیم
    const buys = events.filter(e => e.type === EventType.BUY);
    
    if (buys.length < 3) return null; // حداقل ۳ معامله نیاز است

    // منطق ساده: اگر کاربر در ۳ معامله آخر، در زمان افزایش قیمت خرید کرده باشد
    // (این یک منطق ساده است و در فازهای بعدی پیچیده‌تر می‌شود)
    const recentBuys = buys.slice(-3);
    const fomoDetected = recentBuys.every((buy, index) => {
      if (index === 0) return true;
      return (buy.price || 0) > (recentBuys[index - 1].price || 0);
    });

    if (fomoDetected) {
      return {
        pattern: BehaviorPattern.FOMO,
        confidence: 75,
        description: 'شما در ۳ معامله اخیر، در حالی که قیمت در حال افزایش بود، خرید کرده‌اید. این ممکن است نشانه‌ی FOMO باشد.',
        triggeredEvents: recentBuys,
      };
    }

    return null;
  }

  /**
   * تشخیص الگوی Panic Sell (فروش در زمان افت قیمت)
   */
  private detectPanicSell(events: FinancialEvent[]): ReflectionResult | null {
    const sells = events.filter(e => e.type === EventType.SELL);
    
    if (sells.length < 3) return null;

    const recentSells = sells.slice(-3);
    const panicDetected = recentSells.every((sell, index) => {
      if (index === 0) return true;
      return (sell.price || 0) < (recentSells[index - 1].price || 0);
    });

    if (panicDetected) {
      return {
        pattern: BehaviorPattern.PANIC_SELL,
        confidence: 70,
        description: 'شما در ۳ معامله اخیر، در حالی که قیمت در حال کاهش بود، فروخته‌اید. ممکن است این یک واکنش هیجانی به افت بازار باشد.',
        triggeredEvents: recentSells,
      };
    }

    return null;
  }

  /**
   * تشخیص الگوی Revenge Trade (معامله انتقامی پس از ضرر)
   */
  private detectRevengeTrade(events: FinancialEvent[]): ReflectionResult | null {
    // این یک منطق پیچیده‌تر است که در فازهای بعدی کامل می‌شود
    return null;
  }
}
