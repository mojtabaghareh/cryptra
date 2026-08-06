// ============================================================
// MarketService.ts - Live Price Service with Event Emitter
// ============================================================

export interface LivePrice {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
}

type PriceUpdateCallback = (prices: LivePrice[]) => void;

export class MarketService {
  private static instance: MarketService;
  private callbacks: PriceUpdateCallback[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private symbols: string[] = [];

  // Singleton pattern
  public static getInstance(): MarketService {
    if (!MarketService.instance) {
      MarketService.instance = new MarketService();
    }
    return MarketService.instance;
  }

  // شروع به‌روزرسانی خودکار
  startLiveUpdates(symbols: string[], intervalMs: number = 3000) {
    this.symbols = symbols;
    
    // اگر قبلاً اینتروالی وجود دارد، آن را پاک کن
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // اینتروال جدید ایجاد کن
    this.intervalId = setInterval(async () => {
      const prices = await this.fetchPrices(symbols);
      // به تمام شنونده‌ها اطلاع بده
      this.notifyListeners(prices);
    }, intervalMs);
  }

  // ثبت شنونده
  subscribe(callback: PriceUpdateCallback) {
    this.callbacks.push(callback);
    // یک تابع برای لغو اشتراک برگردان
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  // اطلاع‌رسانی به همه شنونده‌ها
  private notifyListeners(prices: LivePrice[]) {
    this.callbacks.forEach(callback => {
      try {
        callback(prices);
      } catch (error) {
        console.error('Error in price update callback:', error);
      }
    });
  }

  // دریافت قیمت‌ها (با نوسان تصادفی)
  private async fetchPrices(symbols: string[]): Promise<LivePrice[]> {
    // شبیه‌سازی تغییر قیمت
    return symbols.map((symbol) => {
      const basePrice = symbol === 'BTC' ? 62541 : symbol === 'ETH' ? 3412 : symbol === 'SOL' ? 145 : symbol === 'TON' ? 6.2 : 13.6;
      const fluctuation = (Math.random() - 0.5) * 0.02;
      const newPrice = basePrice * (1 + fluctuation);
      
      return {
        symbol,
        price: newPrice,
        change24h: (Math.random() - 0.5) * 10,
        volume: Math.random() * 1000000,
      };
    });
  }

  // توقف به‌روزرسانی‌ها (برای پاک‌سازی)
  stopLiveUpdates() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
