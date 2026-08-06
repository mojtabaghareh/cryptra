// ============================================================
// MarketService.ts - Live Price Service
// ============================================================

export interface LivePrice {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
}

export class MarketService {
  private static instance: MarketService;
  private listeners: Map<string, ((data: LivePrice[]) => void)[]> = new Map();

  public static getInstance(): MarketService {
    if (!MarketService.instance) {
      MarketService.instance = new MarketService();
    }
    return MarketService.instance;
  }

  // شبیه‌سازی دریافت قیمت‌ها از یک API (مثلاً CoinGecko)
  // در نسخه واقعی، اینجا درخواست به API فرستاده می‌شود
  async fetchPrices(symbols: string[]): Promise<LivePrice[]> {
    // شبیه‌سازی تغییر قیمت
    const mockPrices: LivePrice[] = symbols.map((symbol) => {
      const basePrice = symbol === 'BTC' ? 62541 : symbol === 'ETH' ? 3412 : symbol === 'SOL' ? 145 : symbol === 'TON' ? 6.2 : 13.6;
      // ایجاد نوسان تصادفی در قیمت
      const fluctuation = (Math.random() - 0.5) * 0.02; // تغییر ۲٪
      const newPrice = basePrice * (1 + fluctuation);
      
      return {
        symbol,
        price: newPrice,
        change24h: (Math.random() - 0.5) * 10,
        volume: Math.random() * 1000000,
      };
    });

    return mockPrices;
  }

  // شروع به‌روزرسانی خودکار قیمت‌ها
  startLiveUpdates(symbols: string[], intervalMs: number = 5000) {
    setInterval(async () => {
      const prices = await this.fetchPrices(symbols);
      this.notifyListeners(prices);
    }, intervalMs);
  }

  // ثبت شنونده برای دریافت به‌روزرسانی‌ها
  onPriceUpdate(callback: (data: LivePrice[]) => void) {
    const key = 'global';
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key)!.push(callback);
  }

  private notifyListeners(prices: LivePrice[]) {
    const key = 'global';
    const listeners = this.listeners.get(key) || [];
    listeners.forEach(callback => callback(prices));
  }
}
