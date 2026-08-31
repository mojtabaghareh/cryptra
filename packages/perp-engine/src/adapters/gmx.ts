import { placeGmxOrder, isGmxAgentConfigured } from '../agents/gmxAgent';
import type { IPerpAdapter, OrderSide, OrderType, PerpMarketSnapshot } from '../types';

/**
 * GMX Synthetics — official oracle / infra API
 * Tickers: https://arbitrum-api.gmxinfra.io/prices/tickers
 * Oracle:  https://arbitrum-api.gmxinfra.io (GMX docs)
 * Orders: on-chain Arbitrum via agent key (GMX_PRIVATE_KEY)
 * Docs: https://docs.gmx.io/
 */

function oracleBase(): string {
  return process.env.GMX_ORACLE_URL?.trim() || 'https://arbitrum-api.gmxinfra.io';
}

export class GmxAdapter implements IPerpAdapter {
  readonly id = 'gmx';
  readonly name = 'GMX';

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${oracleBase()}/prices/tickers`, {
        signal: AbortSignal.timeout(6000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getMarkPrice(symbol: string): Promise<string> {
    const res = await fetch(`${oracleBase()}/prices/tickers`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`GMX tickers failed: ${res.status}`);
    const list = (await res.json()) as Array<{
      tokenSymbol?: string;
      maxPrice?: string;
      minPrice?: string;
    }>;
    const sym = symbol.toUpperCase().replace(/-PERP$/i, '').replace(/-USD$/i, '');
    const row = list.find((t) => (t.tokenSymbol || '').toUpperCase() === sym);
    if (!row?.maxPrice) throw new Error(`GMX: no price for ${symbol}`);
    // Official GMX prices are 30-decimal fixed-point integers
    const human = Number(BigInt(row.maxPrice)) / 1e30;
    if (!Number.isFinite(human) || human <= 0) {
      throw new Error(`GMX: invalid price decode for ${symbol}`);
    }
    return String(human);
  }

  async listMarkets(): Promise<PerpMarketSnapshot[]> {
    const res = await fetch(`${oracleBase()}/prices/tickers`, {
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) throw new Error(`GMX tickers failed: ${res.status}`);
    const list = (await res.json()) as Array<{
      tokenAddress?: string;
      tokenSymbol?: string;
      minPrice?: string;
      maxPrice?: string;
      updatedAt?: number;
    }>;

    return list
      .filter((t) => t.tokenSymbol && t.maxPrice)
      .map((t) => {
        const max = Number(BigInt(t.maxPrice!)) / 1e30;
        const min = t.minPrice ? Number(BigInt(t.minPrice)) / 1e30 : max;
        const mid = (max + min) / 2;
        return {
          symbol: t.tokenSymbol!.toUpperCase(),
          markPrice: String(max),
          midPrice: String(mid),
          indexPrice: String(mid),
          raw: t,
        };
      });
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
    const result = await placeGmxOrder({
      symbol: params.symbol.replace(/-PERP$/i, '').replace(/-USD$/i, ''),
      isBuy: params.side === 'LONG',
      size: params.size,
      leverage: params.leverage,
    });

    if (result.executed) {
      return {
        externalId: result.externalId || `gmx-${Date.now()}`,
        status: 'filled',
        message: result.message,
      };
    }

    if (result.mode === 'tracking_only' || result.externalId) {
      return {
        externalId: result.externalId || `gmx-track-${Date.now()}`,
        status: 'open',
        message: result.message,
      };
    }

    throw new Error(
      result.message ||
        (isGmxAgentConfigured()
          ? 'GMX order path failed'
          : 'Set GMX_PRIVATE_KEY for signed GMX execution on Arbitrum'),
    );
  }
}

export const gmxAdapter = new GmxAdapter();
export { isGmxAgentConfigured };
