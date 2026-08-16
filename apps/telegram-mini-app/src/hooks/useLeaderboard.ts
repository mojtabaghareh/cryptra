import { useCallback, useState } from 'react';
import type { XPLeader, TradingLeader, ReferralLeader } from '../types';
import { useLeaderboardStore } from '../store/leaderboardStore';

type LeaderboardType = 'xp' | 'trading' | 'referral';
type Timeframe = 'all' | 'week' | 'month';

interface UseLeaderboardReturn {
  type: LeaderboardType;
  timeframe: Timeframe;
  xpLeaders: XPLeader[];
  tradingLeaders: TradingLeader[];
  referralLeaders: ReferralLeader[];
  isLoading: boolean;
  error: string | null;
  setType: (type: LeaderboardType) => void;
  setTimeframe: (timeframe: Timeframe) => void;
  refresh: () => Promise<void>;
}

export function useLeaderboard(): UseLeaderboardReturn {
  const store = useLeaderboardStore();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaders = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/leaderboard/${store.type}?timeframe=${store.timeframe}&limit=50`
      );
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      const data = await res.json();
      switch (store.type) {
        case 'xp':
          store.setXpLeaders(data as XPLeader[]);
          break;
        case 'trading':
          store.setTradingLeaders(data as TradingLeader[]);
          break;
        case 'referral':
          store.setReferralLeaders(data as ReferralLeader[]);
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, [store]);

  const refresh = useCallback(async (): Promise<void> => {
    await fetchLeaders();
  }, [fetchLeaders]);

  return {
    type: store.type,
    timeframe: store.timeframe,
    xpLeaders: store.xpLeaders,
    tradingLeaders: store.tradingLeaders,
    referralLeaders: store.referralLeaders,
    isLoading,
    error,
    setType: store.setType,
    setTimeframe: store.setTimeframe,
    refresh,
  };
}

