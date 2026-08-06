// ============================================================
// hyperliquid.ts - Hyperliquid Adapter
// ============================================================

export interface HyperliquidOrder {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  size: number;
  price?: number;
  leverage?: number;
}

export class HyperliquidAdapter {
  async placeOrder(order: HyperliquidOrder): Promise<{ success: boolean; txHash?: string }> {
    console.log('📤 ارسال سفارش به Hyperliquid:', order);
    
    // شبیه‌سازی ارسال واقعی به API Hyperliquid
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      txHash: `0x${Math.random().toString(16).substring(2, 40)}`,
    };
  }
}
