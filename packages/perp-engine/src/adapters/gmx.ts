import type { IPerpAdapter, OrderSide, OrderType } from '../types';
import { placeGmxOrder, isGmxAgentConfigured } from '../agents/gmxAgent';

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
    const raw = BigInt(row.maxPrice);
    const human = Number(raw) / 1e30;
    return String(human);
  }

  async placeOrder(params: {
    symbol: string;
    side: OrderSide;
    type: OrderType;
    size: string;
    price?: string;
    stopPrice?: string;
    leverage: number;
    userAddress?: string;
  }): Promise<{ externalId: string; status: string }> {
    const result = await placeGmxOrder({
      symbol: params.symbol,
      isBuy: params.side === 'LONG',
      size: params.size,
      leverage: params.leverage,
      reduceOnly: false,
    });

    if (result.executed) {
      return {
        externalId: result.externalId || `gmx-${Date.now()}`,
        status: 'filled',
      };
    }

    if (result.mode === 'tracking_only' || result.mode === 'skipped') {
      // Intent may still be signed
      if (result.externalId) {
        return { externalId: result.externalId, status: 'open' };
      }
      if (result.mode === 'tracking_only') {
        return { externalId: `gmx-track-${Date.now()}`, status: 'open' };
      }
    }

    throw new Error(result.message || 'GMX order failed');
  }
}

export const gmxAdapter = new GmxAdapter();
export { isGmxAgentConfigured };
