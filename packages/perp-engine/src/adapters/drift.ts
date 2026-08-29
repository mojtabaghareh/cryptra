import type { IPerpAdapter, OrderSide, OrderType } from '../types';

const DATA_API = process.env.DRIFT_DATA_API || 'https://data.api.drift.trade';

/**
 * Drift Protocol (Solana perps).
 * Market data via Drift data API; orders need @drift-labs/sdk + Phantom.
 * https://docs.drift.trade/
 */
export class DriftAdapter implements IPerpAdapter {
  readonly id = 'drift';
  readonly name = 'Drift';

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${DATA_API}/contracts`, {
        signal: AbortSignal.timeout(6000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getMarkPrice(symbol: string): Promise<string> {
    // Try markets endpoint variants
    const res = await fetch(`${DATA_API}/market/${encodeURIComponent(symbol)}`, {
      signal: AbortSignal.timeout(8000),
    }).catch(() => null);

    if (res?.ok) {
      const data = (await res.json()) as { markPrice?: string | number; price?: string | number };
      const px = data.markPrice ?? data.price;
      if (px != null) return String(px);
    }

    // Fallback: oracle-ish from contracts list
    const listRes = await fetch(`${DATA_API}/contracts`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!listRes.ok) throw new Error(`Drift contracts failed: ${listRes.status}`);
    const list = (await listRes.json()) as unknown;
    const arr = Array.isArray(list) ? list : (list as { contracts?: unknown[] }).contracts || [];
    const sym = symbol.toUpperCase();
    for (const item of arr as Array<Record<string, unknown>>) {
      const name = String(item.symbol || item.market || item.ticker || '').toUpperCase();
      if (name.includes(sym)) {
        const px = item.markPrice ?? item.lastPrice ?? item.oraclePrice;
        if (px != null) return String(px);
      }
    }
    throw new Error(`Drift: no price for ${symbol}`);
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
      'Drift orders require @drift-labs/sdk signed by Phantom on Solana. ' +
        'Server exposes market data only until client signing is wired.',
    );
  }
}

export const driftAdapter = new DriftAdapter();
