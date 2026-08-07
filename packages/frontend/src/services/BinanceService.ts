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

  // این متد جدید را اضافه کنید
  async fetchPrices(symbols: string[]): Promise<BinancePrice[]> {
    // در نسخه واقعی، اینجا به API متصل می‌شود
    // اما فعلاً داده‌های شبیه‌سازی‌شده برمی‌گرداند
    return [
      { symbol: 'BTC', price: 62541.20, change24h: 4.25 },
      { symbol: 'ETH', price: 3412.75, change24h: 3.10 },
      { symbol: 'SOL', price: 145.25, change24h: 2.85 },
      { symbol: 'TON', price: 6.25, change24h: 2.45 },
    ];
  }

  connect(symbols: string[]) {
    if (this.socket?.readyState === WebSocket.OPEN) return;

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
        const price = parseFloat(data.c);
        const change24h = parseFloat(data.P);

        this.latestPrices.set(symbol, { symbol, price, change24h });
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