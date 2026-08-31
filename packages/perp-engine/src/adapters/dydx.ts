import { placeDydxOrder, isDydxAgentConfigured } from '../agents/dydxAgent';
import type { IPerpAdapter, OrderSide, OrderType, PerpMarketSnapshot } from '../types';

/**
 * dYdX v4 — official Indexer API
 * Mainnet: https://indexer.dydx.trade/v4
 * Docs: https://docs.dydx.exchange/
 * Orders: signed on dYdX Chain via @dydxprotocol/v4-client-js + DYDX_MNEMONIC
 */

function indexerBase(): string {
  return (
    process.env.DYDX_INDEXER_URL?.trim() ||
    (process.env.DYDX_NETWORK === 'testnet'
      ? 'https://indexer.v4testnet.dydx.exchange/v4'
      : 'https://indexer.dydx.trade/v4')
  );
}

function toMarketId(symbol: string): string {
  const s = symbol.toUpperCase();
  if (s.includes('-')) return s;
  return `${s}-USD`;
}

export class DydxAdapter implements IPerpAdapter {
  readonly id = 'dydx';
  readonly name = 'dYdX';

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${indexerBase()}/perpetualMarkets`, {
        signal: AbortSignal.timeout(6000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getMarkPrice(symbol: string): Promise<string> {
    const market = toMarketId(symbol);
    const res = await fetch(`${indexerBase()}/perpetualMarkets?ticker=${encodeURIComponent(market)}`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      // full list fallback
      const all = await fetch(`${indexerBase()}/perpetualMarkets`, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!all.ok) throw new Error(`dYdX markets failed: ${all.status}`);
      const body = (await all.json()) as {
        markets?: Record<string, { oraclePrice?: string; midPrice?: string; markPrice?: string }>;
      };
      const row = body.markets?.[market];
      const px = row?.oraclePrice || row?.markPrice || row?.midPrice;
      if (!px) throw new Error(`dYdX: no price for ${market}`);
      return px;
    }
    const body = (await res.json()) as {
      markets?: Record<string, { oraclePrice?: string; midPrice?: string; markPrice?: string }>;
    };
    const row = body.markets?.[market] || Object.values(body.markets || {})[0];
    const px = row?.oraclePrice || row?.markPrice || row?.midPrice;
    if (!px) throw new Error(`dYdX: no price for ${market}`);
    return px;
  }

  async listMarkets(): Promise<PerpMarketSnapshot[]> {
    const res = await fetch(`${indexerBase()}/perpetualMarkets`, {
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) throw new Error(`dYdX perpetualMarkets failed: ${res.status}`);
    const body = (await res.json()) as {
      markets?: Record<
        string,
        {
          ticker?: string;
          oraclePrice?: string;
          midPrice?: string;
          markPrice?: string;
          nextFundingRate?: string;
          openInterest?: string;
          volume24H?: string;
          atomicResolution?: number;
          clobPairId?: string;
        }
      >;
    };
    const markets = body.markets || {};
    return Object.entries(markets).map(([ticker, m]) => ({
      symbol: m.ticker || ticker,
      markPrice: m.markPrice || m.oraclePrice,
      midPrice: m.midPrice || m.oraclePrice,
      indexPrice: m.oraclePrice,
      fundingRate: m.nextFundingRate,
      openInterest: m.openInterest,
      volume24h: m.volume24H,
      raw: m,
    }));
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
  }): Promise<{ externalId: string; status: string; message?: string }> {
    const result = await placeDydxOrder({
      symbol: toMarketId(params.symbol),
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
        message: result.message,
      };
    }

    if (result.mode === 'tracking_only') {
      return {
        externalId: `dydx-track-${Date.now()}`,
        status: 'open',
        message: result.message,
      };
    }

    throw new Error(
      result.message ||
        (isDydxAgentConfigured()
          ? 'dYdX order failed'
          : 'Set DYDX_MNEMONIC (and install @dydxprotocol/v4-client-js) for live orders'),
    );
  }
}

export const dydxAdapter = new DydxAdapter();
export { isDydxAgentConfigured };
