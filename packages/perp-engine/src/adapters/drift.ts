import { placeDriftOrder, isDriftAgentConfigured } from '../agents/driftAgent';
import type { IPerpAdapter, OrderSide, OrderType, PerpMarketSnapshot } from '../types';

/**
 * Drift Protocol (Solana perps) — official Data API
 * Data: https://data.api.drift.trade
 * DLOB: https://dlob.drift.trade
 * Docs: https://docs.drift.trade/
 * Orders: @drift-labs/sdk + DRIFT_PRIVATE_KEY
 */

function dataApi(): string {
  return process.env.DRIFT_DATA_API?.trim() || 'https://data.api.drift.trade';
}

function dlobApi(): string {
  return process.env.DRIFT_DLOB_URL?.trim() || 'https://dlob.drift.trade';
}

export class DriftAdapter implements IPerpAdapter {
  readonly id = 'drift';
  readonly name = 'Drift';

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${dataApi()}/contracts`, {
        signal: AbortSignal.timeout(6000),
      });
      return res.ok;
    } catch {
      // DLOB fallback ping
      try {
        const r = await fetch(`${dlobApi()}/l2?marketName=SOL-PERP&depth=1`, {
          signal: AbortSignal.timeout(5000),
        });
        return r.ok;
      } catch {
        return false;
      }
    }
  }

  async getMarkPrice(symbol: string): Promise<string> {
    const name = symbol.toUpperCase().includes('-')
      ? symbol.toUpperCase()
      : `${symbol.toUpperCase()}-PERP`;

    // 1) DLOB oracle/mark style
    try {
      const res = await fetch(`${dlobApi()}/l2?marketName=${encodeURIComponent(name)}&depth=1`, {
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          oracle?: number | string;
          mark?: number | string;
          slot?: number;
        };
        const px = data.mark ?? data.oracle;
        if (px != null) return String(px);
      }
    } catch {
      /* continue */
    }

    // 2) Data API market
    try {
      const res = await fetch(`${dataApi()}/market/${encodeURIComponent(name)}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          markPrice?: string | number;
          price?: string | number;
          oraclePrice?: string | number;
        };
        const px = data.markPrice ?? data.oraclePrice ?? data.price;
        if (px != null) return String(px);
      }
    } catch {
      /* continue */
    }

    // 3) contracts list
    const listRes = await fetch(`${dataApi()}/contracts`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!listRes.ok) throw new Error(`Drift contracts failed: ${listRes.status}`);
    const list = (await listRes.json()) as unknown;
    const arr = Array.isArray(list) ? list : (list as { contracts?: unknown[] }).contracts || [];
    const sym = name.replace('-PERP', '');
    for (const item of arr as Array<Record<string, unknown>>) {
      const n = String(item.symbol || item.market || item.ticker || '').toUpperCase();
      if (n.includes(sym) || n === name) {
        const px = item.markPrice ?? item.lastPrice ?? item.oraclePrice;
        if (px != null) return String(px);
      }
    }
    throw new Error(`Drift: no price for ${name}`);
  }

  async listMarkets(): Promise<PerpMarketSnapshot[]> {
    // Prefer contracts endpoint
    try {
      const res = await fetch(`${dataApi()}/contracts`, {
        signal: AbortSignal.timeout(12_000),
      });
      if (res.ok) {
        const list = (await res.json()) as unknown;
        const arr = Array.isArray(list) ? list : (list as { contracts?: unknown[] }).contracts || [];
        const out: PerpMarketSnapshot[] = [];
        for (const item of arr as Array<Record<string, unknown>>) {
          const symbol = String(item.symbol || item.market || item.ticker || '');
          if (!symbol) continue;
          const mark = item.markPrice ?? item.lastPrice ?? item.oraclePrice;
          out.push({
            symbol: symbol.toUpperCase(),
            markPrice: mark != null ? String(mark) : undefined,
            midPrice: mark != null ? String(mark) : undefined,
            fundingRate: item.fundingRate != null ? String(item.fundingRate) : undefined,
            openInterest: item.openInterest != null ? String(item.openInterest) : undefined,
            raw: item,
          });
        }
        if (out.length) return out;
      }
    } catch {
      /* fall through */
    }

    // Minimal known perps via DLOB
    const defaults = ['SOL-PERP', 'BTC-PERP', 'ETH-PERP', 'JTO-PERP', 'WIF-PERP'];
    const snaps: PerpMarketSnapshot[] = [];
    for (const m of defaults) {
      try {
        const px = await this.getMarkPrice(m);
        snaps.push({ symbol: m, markPrice: px, midPrice: px });
      } catch {
        /* skip */
      }
    }
    return snaps;
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
    const result = await placeDriftOrder({
      symbol: params.symbol,
      isBuy: params.side === 'LONG',
      size: params.size,
      leverage: params.leverage,
    });

    if (result.executed) {
      return {
        externalId: result.externalId || `drift-${Date.now()}`,
        status: 'filled',
        message: result.message,
      };
    }

    if (result.mode === 'tracking_only' || result.externalId) {
      return {
        externalId: result.externalId || `drift-track-${Date.now()}`,
        status: 'open',
        message: result.message,
      };
    }

    throw new Error(
      result.message ||
        (isDriftAgentConfigured()
          ? 'Drift order failed'
          : 'Set DRIFT_PRIVATE_KEY and @drift-labs/sdk for live Drift orders'),
    );
  }
}

export const driftAdapter = new DriftAdapter();
export { isDriftAgentConfigured };
