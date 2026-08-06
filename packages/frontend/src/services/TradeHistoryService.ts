// ============================================================
// TradeHistoryService.ts - Fetch Real Trade History
// ============================================================

export interface Trade {
  id: string;
  pair: string;
  type: 'Buy' | 'Sell' | 'Swap';
  entry: number;
  exit: number;
  holding: string;
  pnl: string;
  timestamp: number;
}

export class TradeHistoryService {
  private static instance: TradeHistoryService;

  public static getInstance(): TradeHistoryService {
    if (!TradeHistoryService.instance) {
      TradeHistoryService.instance = new TradeHistoryService();
    }
    return TradeHistoryService.instance;
  }

  /**
   * دریافت تاریخچه معاملات کاربر از دیتابیس
   * در نسخه واقعی، اینجا به بک‌اند (Supabase) متصل می‌شود
   */
  async getUserTrades(userId: string, weekNumber: number): Promise<Trade[]> {
    // شبیه‌سازی دریافت داده از دیتابیس
    // در نسخه واقعی: await fetch(`/api/trades?userId=${userId}&week=${weekNumber}`)
    await new Promise(resolve => setTimeout(resolve, 500));

    // بازگرداندن داده‌های شبیه‌سازی‌شده برای نمایش
    return [
      { id: '1', pair: 'ETH/USDT', type: 'Buy', entry: 3420, exit: 3480, holding: '4h', pnl: '+1.8%', timestamp: Date.now() - 86400000 },
      { id: '2', pair: 'BTC/USDT', type: 'Sell', entry: 68000, exit: 67500, holding: '2h', pnl: '-0.7%', timestamp: Date.now() - 172800000 },
      { id: '3', pair: 'SOL/USDT', type: 'Swap', entry: 148, exit: 152, holding: '6h', pnl: '+2.7%', timestamp: Date.now() - 259200000 },
    ];
  }
}
