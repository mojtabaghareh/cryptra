import type { IPerpAdapter, OrderSide, OrderType } from '../types';
import { placeDydxOrder, isDydxAgentConfigured } from '../agents/dydxAgent';

const INDEXER =
  process.env.DYDX_INDEXER_URL || 'https://indexer.dydx.trade/v4';

export class DydxAdapter implements IPerpAdapter {
  readonly id = 'dydx';
  readonly name = 'dYdX';

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${INDEXER}/perpetualMarkets`, {
        signal: AbortSignal.timeout(6000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getMarkPrice(symbol: string): Promise<string> {
    const market = symbol.includes('-') ? symbol : `${symbol}-USD`;
    const res = await fetch(`${INDEXER}/perpetualMarkets`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`dYdX markets failed: ${res.status}`);
    const body = (await res.json()) as {
      markets?: Record<string, { oraclePrice?: string; midPrice?: string }>;
    };
    const row = body.markets?.[market] || body.markets?.[`${symbol}-USD`];
    const px = row?.oraclePrice || row?.midPrice;
    if (!px) throw new Error(`dYdX: no price for ${market}`);
    return px;
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
    const result = await placeDydxOrder({
      symbol: params.symbol,
      isBuy: params.side === 'LONG',
      size: params.size,
      price: params.price,
      leverage: params.leverage,
      type: params.type === 'LIMIT' ? 'LIMIT' : 'MARKET',
    });

    if (result.executed) {
      return {
        externalId: result.externalId || `dydx-${Date.now()}`,
        status: 'filled',
      };
    }

    // Tracking path still returns open so Cryptra records the attempt
    if (result.mode === 'tracking_only') {
      return {
        externalId: `dydx-track-${Date.now()}`,
        status: 'open',
      };
    }

    throw new Error(result.message || 'dYdX order failed');
  }
}

export const dydxAdapter = new DydxAdapter();
export { isDydxAgentConfigured };
