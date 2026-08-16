import { create } from 'zustand';
import type { Market } from '../types';

interface MarketState {
  markets: Market[];
  filter: 'all' | 'gainers' | 'losers' | 'volume';
  selectedMarketId: string | null;
  lastUpdated: string | null;
}

interface MarketActions {
  setMarkets: (markets: Market[]) => void;
  setFilter: (filter: MarketState['filter']) => void;
  selectMarket: (id: string | null) => void;
  updateMarketPrice: (id: string, price: number, change24h: number) => void;
  setLastUpdated: (date: string) => void;
}

export const useMarketStore = create<MarketState & MarketActions>((set) => ({
  markets: [],
  filter: 'all',
  selectedMarketId: null,
  lastUpdated: null,

  setMarkets: (markets) => set({ markets, lastUpdated: new Date().toISOString() }),

  setFilter: (filter) => set({ filter }),

  selectMarket: (selectedMarketId) => set({ selectedMarketId }),

  updateMarketPrice: (id, price, change24h) =>
    set((s) => ({
      markets: s.markets.map((m) =>
        m.id === id ? { ...m, price, priceChange24h: change24h } : m
      ),
    })),

  setLastUpdated: (lastUpdated) => set({ lastUpdated }),
}));

