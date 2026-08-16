import { useCallback, useEffect, useState } from 'react';
import type { LevelInfo, XPData } from '../types';
import { useWallet } from './useWallet';

interface UseLevelReturn {
  currentLevel: LevelInfo | null;
  nextLevel: LevelInfo | null;
  progress: number;
  allLevels: LevelInfo[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const LEVELS: LevelInfo[] = [
  { level: 1, name: 'Novice', minXP: 0, maxXP: 100, perks: ['Basic trading'] },
  { level: 2, name: 'Apprentice', minXP: 100, maxXP: 500, perks: ['Reduced fees 5%'] },
  { level: 3, name: 'Trader', minXP: 500, maxXP: 2000, perks: ['Reduced fees 10%', 'Priority support'] },
  { level: 4, name: 'Expert', minXP: 2000, maxXP: 5000, perks: ['Reduced fees 15%', 'Priority support', 'Advanced charts'] },
  { level: 5, name: 'Master', minXP: 5000, maxXP: 10000, perks: ['Reduced fees 20%', 'Priority support', 'Advanced charts', 'VIP events'] },
  { level: 6, name: 'Legend', minXP: 10000, maxXP: 25000, perks: ['Reduced fees 25%', 'Priority support', 'Advanced charts', 'VIP events', 'Custom alerts'] },
  { level: 7, name: 'Immortal', minXP: 25000, maxXP: Infinity, perks: ['Reduced fees 30%', 'All perks unlocked'] },
];

export function useLevel(): UseLevelReturn {
  const { isConnected } = useWallet();
  const [xpData, setXpData] = useState<XPData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLevel = useCallback(async (): Promise<void> => {
    if (!isConnected) {
      setXpData(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/xp');
      if (!res.ok) throw new Error('Failed to fetch level data');
      const data: XPData = await res.json();
      setXpData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load level');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    void fetchLevel();
  }, [fetchLevel]);

  const currentLevel = xpData
    ? LEVELS.find((l) => xpData.currentXP >= l.minXP && xpData.currentXP < l.maxXP) ?? LEVELS[LEVELS.length - 1]
    : null;

  const nextLevel = currentLevel
    ? LEVELS.find((l) => l.level === currentLevel.level + 1) ?? null
    : null;

  const progress = currentLevel && xpData
    ? nextLevel
      ? ((xpData.currentXP - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100
      : 100
    : 0;

  return {
    currentLevel,
    nextLevel,
    progress,
    allLevels: LEVELS,
    isLoading,
    error,
    refresh: fetchLevel,
  };
}

