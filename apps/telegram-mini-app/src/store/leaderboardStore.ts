import { create } from 'zustand';
import type { XPLeader, TradingLeader, ReferralLeader } from '../types';

type LeaderboardType = 'xp' | 'trading' | 'referral';
type Timeframe = 'all' | 'week' | 'month';

interface LeaderboardState {
  type: LeaderboardType;
  timeframe: Timeframe;
  xpLeaders: XPLeader[];
  tradingLeaders: TradingLeader[];
  referralLeaders: ReferralLeader[];
  lastUpdated: string | null;
}

interface LeaderboardActions {
  setType: (type: LeaderboardType) => void;
  setTimeframe: (timeframe: Timeframe) => void;
  setXpLeaders: (leaders: XPLeader[]) => void;
  setTradingLeaders: (leaders: TradingLeader[]) => void;
  setReferralLeaders: (leaders: ReferralLeader[]) => void;
  clearLeaders: () => void;
}

export const useLeaderboardStore = create<LeaderboardState & LeaderboardActions>((set) => ({
  type: 'xp',
  timeframe: 'all',
  xpLeaders: [],
  tradingLeaders: [],
  referralLeaders: [],
  lastUpdated: null,

  setType: (type) => set({ type }),

  setTimeframe: (timeframe) => set({ timeframe }),

  setXpLeaders: (xpLeaders) => set({ xpLeaders, lastUpdated: new Date().toISOString() }),

  setTradingLeaders: (tradingLeaders) => set({ tradingLeaders, lastUpdated: new Date().toISOString() }),

  setReferralLeaders: (referralLeaders) => set({ referralLeaders, lastUpdated: new Date().toISOString() }),

  clearLeaders: () =>
    set({
      xpLeaders: [],
      tradingLeaders: [],
      referralLeaders: [],
      lastUpdated: null,
    }),
}));

