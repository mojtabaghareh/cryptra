import { useCallback, useEffect, useState } from 'react';
import type { Market } from '../types';
import { useMarketStore } from '../store/marketStore';

interface UseMarketsReturn {
  markets: Market[];
  isLoading: boolean;
  error: string | null;
  filter: 'all' | 'gainers' | 'losers' | 'volume';
  setFilter: (filter: UseMarketsReturn['filter']) => void;
  refresh: () => Promise<void>;
  getMarketById: (id: string) => Market | undefined;
}

export function useMarkets(): UseMarketsReturn {
  const store = useMarketStore();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMarkets = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/markets?limit=100');
      if (!res.ok) throw new Error('Failed to fetch markets');
      const data: Market[] = await res.json();
      store.setMarkets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [store]);

  useEffect(() => {
    if (store.markets.length === 0) {
      void fetchMarkets();
    }
  }, [fetchMarkets, store.markets.length]);

  const refresh = useCallback(async (): Promise<void> => {
    await fetchMarkets();
  }, [fetchMarkets]);

  const getMarketById = useCallback(
    (id: string): Market | undefined => {
      return store.markets.find((m) => m.id === id);
    },
    [store.markets]
  );

  const filteredMarkets = store.markets.filter((m) => {
    switch (store.filter) {
      case 'gainers':
        return m.priceChange24h > 0;
      case 'losers':
        return m.priceChange24h < 0;
      case 'volume':
        return m.volume24h > 0;
      default:
        return true;
    }
  });

  return {
    markets: filteredMarkets,
    isLoading,
    error,
    filter: store.filter,
    setFilter: store.setFilter,
    refresh,
    getMarketById,
  };
}

