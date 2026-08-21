import { getConfig } from '@cryptra/config';
import type { TokenPrice } from '../types';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export class CoinGeckoProvider {
  private get headers(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    try {
      const key = getConfig().COINGECKO_API_KEY;
      if (key) {
        headers['x-cg-pro-api-key'] = key;
      }
    } catch {
      // no config loaded yet
    }
    return headers;
  }

  async getPrices(ids: string[]): Promise<TokenPrice[]> {
    if (ids.length === 0) return [];

    const url = new URL(`${COINGECKO_BASE}/simple/price`);
    url.searchParams.set('ids', ids.join(','));
    url.searchParams.set('vs_currencies', 'usd');
    url.searchParams.set('include_24hr_change', 'true');
    url.searchParams.set('include_market_cap', 'true');
    url.searchParams.set('include_24hr_vol', 'true');

    const res = await fetch(url.toString(), {
      headers: this.headers,
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`CoinGecko price failed: ${res.status} ${text}`);
    }

    const data = (await res.json()) as Record<
      string,
      {
        usd: number;
        usd_24h_change?: number;
        usd_market_cap?: number;
        usd_24h_vol?: number;
      }
    >;

    const now = new Date();
    return Object.entries(data).map(([id, v]) => ({
      id,
      symbol: id,
      priceUsd: v.usd,
      change24h: v.usd_24h_change,
      marketCap: v.usd_market_cap,
      volume24h: v.usd_24h_vol,
      lastUpdated: now,
    }));
  }

  async search(query: string, limit = 10) {
    const url = new URL(`${COINGECKO_BASE}/search`);
    url.searchParams.set('query', query);

    const res = await fetch(url.toString(), {
      headers: this.headers,
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      throw new Error(`CoinGecko search failed: ${res.status}`);
    }

    const data = (await res.json()) as {
      coins: Array<{ id: string; name: string; symbol: string; market_cap_rank?: number }>;
    };

    return (data.coins ?? []).slice(0, limit);
  }
}

export const coinGeckoProvider = new CoinGeckoProvider();
