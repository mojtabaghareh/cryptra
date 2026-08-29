import type { IPerpAdapter, OrderSide, OrderType } from '../types';

/**
 * GMX — uses public price tickers where available.
 * Full order flow needs GMX SDK + wallet on Arbitrum.
 * https://docs.gmx.io/
 */
export class GmxAdapter implements IPerpAdapter {
  readonly id = 'gmx';
  readonly name = 'GMX';

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch('https://arbitrum-api.gmxinfra.io/prices/tickers', {
        signal: AbortSignal.timeout(6000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getMarkPrice(symbol: string): Promise<string> {
    const res = await fetch('https://arbitrum-api.gmxinfra.io/prices/tickers', {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`GMX tickers failed: ${res.status}`);
    const list = (await res.json()) as Array<{
      tokenSymbol?: string;
      maxPrice?: string;
      minPrice?: string;
    }>;
    const sym = symbol.toUpperCase();
    const row = list.find((t) => (t.tokenSymbol || '').toUpperCase() === sym);
    if (!row?.maxPrice) throw new Error(`GMX: no price for ${symbol}`);
    // GMX prices are 30-decimal fixed point
    const raw = BigInt(row.maxPrice);
    const human = Number(raw) / 1e30;
    return String(human);
  }

  async placeOrder(_params: {
    symbol: string;
    side: OrderSide;
    type: OrderType;
    size: string;
    price?: string;
    stopPrice?: string;
    leverage: number;
    userAddress?: string;
  }): Promise<{ externalId: string; status: string }> {
    throw new Error(
      'GMX position opens require on-chain transactions via GMX contracts (Arbitrum). ' +
        'Use client wallet + GMX SDK; server provides mark prices only.',
    );
  }
}

export const gmxAdapter = new GmxAdapter();
