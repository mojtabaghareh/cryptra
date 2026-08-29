import type { IPerpAdapter, OrderSide, OrderType } from '../types';

const INDEXER =
  process.env.DYDX_INDEXER_URL || 'https://indexer.dydx.trade/v4';

/**
 * dYdX v4 — public indexer for markets/oracle prices.
 * Order placement requires client-side wallet signing (dYdX Chain).
 * https://docs.dydx.exchange/
 */
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
      'dYdX orders must be signed with a dYdX Chain wallet on the client. ' +
        'Server only provides market data via indexer.',
    );
  }
}

export const dydxAdapter = new DydxAdapter();
