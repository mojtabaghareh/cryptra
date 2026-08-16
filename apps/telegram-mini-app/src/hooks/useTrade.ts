import { useCallback, useState } from 'react';
import type { PerpMarket, PerpPosition } from '../types';
import { useWallet } from './useWallet';
import { useTradingStore } from '../store/tradingStore';

interface UseTradeReturn {
  markets: PerpMarket[];
  selectedMarket: PerpMarket | null;
  positions: PerpPosition[];
  side: 'long' | 'short';
  leverage: number;
  margin: string;
  quote: {
    margin: number;
    size: number;
    notional: number;
    liquidationPrice: number;
    entryPrice: number;
    fee: number;
  } | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  setSide: (side: 'long' | 'short') => void;
  setLeverage: (leverage: number) => void;
  setMargin: (margin: string) => void;
  selectMarket: (market: PerpMarket) => void;
  fetchMarkets: () => Promise<void>;
  openPosition: () => Promise<void>;
  fetchPositions: () => Promise<void>;
  closePosition: (positionId: string) => Promise<void>;
}

export function useTrade(): UseTradeReturn {
  const { isConnected } = useWallet();
  const store = useTradingStore();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [side, setSide] = useState<'long' | 'short'>('long');
  const [leverage, setLeverage] = useState<number>(5);
  const [margin, setMargin] = useState<string>('');

  const fetchMarkets = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/perpetuals/markets');
      if (!res.ok) throw new Error('Failed to fetch markets');
      const data: PerpMarket[] = await res.json();
      store.setMarkets(data);
      if (data.length > 0 && !store.selectedMarket) {
        store.setSelectedMarket(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load markets');
    } finally {
      setIsLoading(false);
    }
  }, [store]);

  const fetchPositions = useCallback(async (): Promise<void> => {
    if (!isConnected) return;
    try {
      const res = await fetch('/api/v1/perpetuals/positions');
      if (!res.ok) throw new Error('Failed to fetch positions');
      const data: PerpPosition[] = await res.json();
      store.setPositions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load positions');
    }
  }, [isConnected, store]);

  const openPosition = useCallback(async (): Promise<void> => {
    if (!store.selectedMarket || !margin || parseFloat(margin) <= 0 || !isConnected) {
      throw new Error('Invalid position parameters');
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/perpetuals/position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId: store.selectedMarket.id,
          side,
          leverage,
          margin: parseFloat(margin),
        }),
      });
      if (!res.ok) throw new Error('Failed to open position');
      const pos: PerpPosition = await res.json();
      store.addPosition(pos);
      setMargin('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open position');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [store, side, leverage, margin, isConnected]);

  const closePosition = useCallback(
    async (positionId: string): Promise<void> => {
      try {
        const res = await fetch(`/api/v1/perpetuals/position/${positionId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to close position');
        store.removePosition(positionId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to close position');
        throw err;
      }
    },
    [store]
  );

  const quote = store.selectedMarket && margin && parseFloat(margin) > 0
    ? (() => {
        const m = parseFloat(margin);
        const notional = m * leverage;
        const size = notional / store.selectedMarket.markPrice;
        const fee = notional * 0.0006;
        const liqPrice =
          side === 'long'
            ? store.selectedMarket.markPrice * (1 - 0.9 / leverage)
            : store.selectedMarket.markPrice * (1 + 0.9 / leverage);
        return {
          margin: m,
          size,
          notional,
          liquidationPrice: liqPrice,
          entryPrice: store.selectedMarket.markPrice,
          fee,
        };
      })()
    : null;

  return {
    markets: store.markets,
    selectedMarket: store.selectedMarket,
    positions: store.positions,
    side,
    leverage,
    margin,
    quote,
    isLoading,
    isSubmitting,
    error,
    setSide,
    setLeverage,
    setMargin,
    selectMarket: store.setSelectedMarket,
    fetchMarkets,
    openPosition,
    fetchPositions,
    closePosition,
  };
}

