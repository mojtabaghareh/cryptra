// ============================================================
// hyperliquid.ts
// Adapter برای اتصال به صرافی Hyperliquid و اجرای معاملات
// ============================================================

export interface HyperliquidOrder {
  symbol: string;          // نماد معامله (مثلاً BTC/USDC)
  side: 'buy' | 'sell';    // جهت معامله
  type: 'market' | 'limit';// نوع سفارش
  size: number;            // مقدار
  price?: number;          // (اختیاری) برای سفارش‌های Limit
  leverage?: number;       // (اختیاری) اهرم برای معاملات Perpetual
}

export interface HyperliquidResponse {
  success: boolean;
  orderId?: string;
  txHash?: string;
  error?: string;
}

/**
 * کلاس آداپتور Hyperliquid
 * این کلاس مسئول ارتباط با صرافی Hyperliquid و اجرای سفارش‌هاست.
 */
export class HyperliquidAdapter {
  private apiKey: string;
  private baseUrl: string = 'https://api.hyperliquid.xyz';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * اجرای یک سفارش در صرافی Hyperliquid
   */
  async placeOrder(order: HyperliquidOrder): Promise<HyperliquidResponse> {
    try {
      // در نسخه‌ی واقعی، این درخواست به API Hyperliquid ارسال می‌شود
      // const response = await fetch(`${this.baseUrl}/exchange/order`, { ... });
      
      // **شبیه‌سازی پاسخ موفقیت‌آمیز (فقط برای توسعه)**
      console.log('📤 [Hyperliquid] ارسال سفارش:', order);
      
      // شبیه‌سازی تأخیر شبکه
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        orderId: `HL-${Date.now()}`,
        txHash: `0x${Math.random().toString(16).substring(2, 10)}`,
      };
    } catch (error) {
      console.error('خطا در اجرای سفارش در Hyperliquid:', error);
      return {
        success: false,
        error: 'خطا در ارتباط با Hyperliquid',
      };
    }
  }

  /**
   * دریافت قیمت لحظه‌ای یک نماد از Hyperliquid
   */
  async getPrice(symbol: string): Promise<number> {
    // در نسخه‌ی واقعی، قیمت از API خوانده می‌شود
    // شبیه‌سازی قیمت
    return 3450.50; // قیمت فرضی ETH
  }
}
