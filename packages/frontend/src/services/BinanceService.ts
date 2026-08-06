// ============================================================
// BinanceService.ts - Real-Time WebSocket Connection to Binance
// ============================================================

export interface BinancePrice {
  symbol: string;
  price: number;
  change24h: number;
}

export class BinanceService {
  private static instance: BinanceService;
  private socket: WebSocket | null = null;
  private callbacks: ((data: BinancePrice[]) => void)[] = [];
  private latestPrices: Map<string, BinancePrice> = new Map();

  public static getInstance(): BinanceService {
    if (!BinanceService.instance) {
      BinanceService.instance = new BinanceService();
    }
    return BinanceService.instance;
  }

  // شروع اتصال WebSocket به بایننس
  connect(symbols: string[]) {
    if (this.socket?.readyState === WebSocket.OPEN) return;

    // ساخت آدرس جریان داده برای بایننس
    // برای هر نماد، جریان ticker را دریافت می‌کنیم
    const streams = symbols.map(s => `${s.toLowerCase()}@ticker`).join('/');
    const wsUrl = `wss://stream.binance.com:9443/ws/${streams}`;

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('✅ Connected to Binance WebSocket');
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const symbol = data.s.replace('USDT', '');
        const price = parseFloat(data.c); // آخرین قیمت
        const change24h = parseFloat(data.P); // تغییر ۲۴ ساعت

        this.latestPrices.set(symbol, { symbol, price, change24h });
        
        // اطلاع‌رسانی به تمام شنونده‌ها
        this.notifyListeners();
      } catch (error) {
        console.error('Error processing Binance message:', error);
      }
    };

    this.socket.onerror = (error) => {
      console.error('Binance WebSocket error:', error);
    };

    this.socket.onclose = () => {
      console.log('Binance WebSocket closed. Reconnecting in 5s...');
      setTimeout(() => this.connect(symbols), 5000);
    };
  }

  // ثبت شنونده برای دریافت به‌روزرسانی‌ها
  subscribe(callback: (data: BinancePrice[]) => void) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  private notifyListeners() {
    const prices = Array.from(this.latestPrices.values());
    this.callbacks.forEach(cb => cb(prices));
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
