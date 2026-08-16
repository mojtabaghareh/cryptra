import { useCallback, useEffect, useState } from 'react';
import type { PortfolioAsset } from '../types';
import { useWallet } from './useWallet';

interface UsePortfolioReturn {
  assets: PortfolioAsset[];
  totalValue: number;
  totalChange24h: number;
  totalChangePercentage24h: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePortfolio(): UsePortfolioReturn {
  const { address, isConnected } = useWallet();
  const [assets, setAssets] = useState<PortfolioAsset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = useCallback(async (): Promise<void> => {
    if (!isConnected || !address) {
      setAssets([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/portfolio?address=${encodeURIComponent(address)}`);
      if (!res.ok) throw new Error('Failed to fetch portfolio');
      const data: PortfolioAsset[] = await res.json();
      setAssets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolio');
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  useEffect(() => {
    void fetchPortfolio();
  }, [fetchPortfolio]);

  const totalValue = assets.reduce((sum, a) => sum + a.valueUsd, 0);
  const totalChange24h = assets.reduce((sum, a) => sum + a.valueUsd * (a.change24h / 100), 0);
  const totalChangePercentage24h = totalValue > 0 ? (totalChange24h / totalValue) * 100 : 0;

  return {
    assets,
    totalValue,
    totalChange24h,
    totalChangePercentage24h,
    isLoading,
    error,
    refresh: fetchPortfolio,
  };
}

