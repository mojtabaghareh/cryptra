import { useCallback, useEffect, useState } from 'react';
import type { ReferralData } from '../types';
import { useWallet } from './useWallet';

interface UseReferralReturn {
  data: ReferralData | null;
  isLoading: boolean;
  error: string | null;
  copied: boolean;
  refresh: () => Promise<void>;
  copyLink: () => Promise<void>;
  shareLink: () => Promise<void>;
}

export function useReferral(): UseReferralReturn {
  const { isConnected } = useWallet();
  const [data, setData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchData = useCallback(async (): Promise<void> => {
    if (!isConnected) {
      setData(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/referral');
      if (!res.ok) throw new Error('Failed to fetch referral data');
      const d: ReferralData = await res.json();
      setData(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load referral data');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const copyLink = useCallback(async (): Promise<void> => {
    if (!data?.link) return;
    try {
      await navigator.clipboard.writeText(data.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  }, [data]);

  const shareLink = useCallback(async (): Promise<void> => {
    if (!data?.link) return;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({
          title: 'Join me on Cryptra',
          text: 'Trade crypto with me on Cryptra!',
          url: data.link,
        });
      } else {
        await copyLink();
      }
    } catch {
      // User cancelled
    }
  }, [data, copyLink]);

  return {
    data,
    isLoading,
    error,
    copied,
    refresh: fetchData,
    copyLink,
    shareLink,
  };
}

