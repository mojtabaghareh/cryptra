import { useCallback, useEffect, useState } from 'react';
import type { XPData } from '../types';
import { useWallet } from './useWallet';

interface UseXPReturn {
  xp: XPData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  claimDaily: () => Promise<void>;
}

export function useXP(): UseXPReturn {
  const { isConnected } = useWallet();
  const [xp, setXp] = useState<XPData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchXP = useCallback(async (): Promise<void> => {
    if (!isConnected) {
      setXp(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/xp');
      if (!res.ok) throw new Error('Failed to fetch XP');
      const data: XPData = await res.json();
      setXp(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load XP');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    void fetchXP();
  }, [fetchXP]);

  const claimDaily = useCallback(async (): Promise<void> => {
    if (!isConnected) throw new Error('Wallet not connected');
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/xp/claim-daily', { method: 'POST' });
      if (!res.ok) throw new Error('Daily claim failed');
      const data: XPData = await res.json();
      setXp(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Daily claim failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  return {
    xp,
    isLoading,
    error,
    refresh: fetchXP,
    claimDaily,
  };
}

