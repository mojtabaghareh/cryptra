import { create } from 'zustand';
import type { PerpMarket, PerpPosition } from '../types';

interface TradingState {
  markets: PerpMarket[];
  selectedMarket: PerpMarket | null;
  positions: PerpPosition[];
  openOrders: Array<{
    id: string;
    marketId: string;
    side: 'long' | 'short';
    type: 'limit' | 'stop';
    price: number;
    size: number;
    status: 'open' | 'filled' | 'cancelled';
  }>;
}

interface TradingActions {
  setMarkets: (markets: PerpMarket[]) => void;
  setSelectedMarket: (market: PerpMarket | null) => void;
  setPositions: (positions: PerpPosition[]) => void;
  addPosition: (position: PerpPosition) => void;
  removePosition: (id: string) => void;
  updatePosition: (id: string, updates: Partial<PerpPosition>) => void;
  addOrder: (order: TradingState['openOrders'][0]) => void;
  cancelOrder: (id: string) => void;
}

export const useTradingStore = create<TradingState & TradingActions>((set) => ({
  markets: [],
  selectedMarket: null,
  positions: [],
  openOrders: [],

  setMarkets: (markets) => set({ markets }),

  setSelectedMarket: (selectedMarket) => set({ selectedMarket }),

  setPositions: (positions) => set({ positions }),

  addPosition: (position) =>
    set((s) => ({ positions: [...s.positions, position] })),

  removePosition: (id) =>
    set((s) => ({
      positions: s.positions.filter((p) => p.id !== id),
    })),

  updatePosition: (id, updates) =>
    set((s) => ({
      positions: s.positions.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),

  addOrder: (order) =>
    set((s) => ({ openOrders: [...s.openOrders, order] })),

  cancelOrder: (id) =>
    set((s) => ({
      openOrders: s.openOrders.filter((o) => o.id !== id),
    })),
}));

