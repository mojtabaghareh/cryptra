import { CircuitBreaker } from '@cryptra/security';
import { coinGeckoProvider } from './providers/coingecko';
import type { TokenPrice, PriceMap } from './types';

// Simple in-memory cache
const cache = new Map<string, { data: TokenPrice; expiresAt: number }>();
const CACHE_TTL_MS = 15_000; // 15 seconds

const breaker = new CircuitBreaker({
  name: 'market-data:coingecko',
  failureThreshold: 4,
  timeoutMs: 30_000,
});

export class MarketDataService {
  /**
   * Get USD prices for a list of CoinGecko ids.
   * Uses short-lived cache + circuit breaker.
   */
  async getPrices(ids: string[]): Promise<PriceMap> {
    const unique = [...new Set(ids.map((i) => i.toLowerCase()))];
    const result: PriceMap = {};
    const toFetch: string[] = [];

    const now = Date.now();
    for (const id of unique) {
      const cached = cache.get(id);
      if (cached && cached.expiresAt > now) {
        result[id] = cached.data;
      } else {
        toFetch.push(id);
      }
    }

    if (toFetch.length > 0) {
      const fetched = await breaker.execute(() => coinGeckoProvider.getPrices(toFetch));

      for (const price of fetched) {
        cache.set(price.id, {
          data: price,
          expiresAt: now + CACHE_TTL_MS,
        });
        result[price.id] = price;
      }
    }

    return result;
  }

  async getPrice(id: string): Promise<TokenPrice | null> {
    const map = await this.getPrices([id]);
    return map[id.toLowerCase()] ?? null;
  }

  async search(query: string, limit = 10) {
    return breaker.execute(() => coinGeckoProvider.search(query, limit));
  }

  /**
   * Convenience helper for common tokens.
   */
  async getMajorPrices(): Promise<PriceMap> {
    return this.getPrices([
      'bitcoin',
      'ethereum',
      'solana',
      'toncoin',
      'binancecoin',
      'usd-coin',
      'tether',
    ]);
  }
}

export const marketDataService = new MarketDataService();
