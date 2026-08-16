import { useCallback, useEffect, useState } from 'react';
import { Card, Skeleton, Button, Badge, EmptyState, PriceDisplay } from '@cryptra/ui';
import { useTranslation } from '@cryptra/i18n';
import { useWalletStore } from '@cryptra/wallets';
import { formatCompactNumber } from '@cryptra/core';
import RewardCard from './RewardCard';
import Achievements from './Achievements';
import styles from './Rewards.module.css';

type RewardTab = 'available' | 'claimed' | 'achievements';
type RewardType = 'token' | 'nft' | 'xp' | 'badge';
type RewardStatus = 'available' | 'claimed' | 'expired';

interface Reward {
  id: string;
  name: string;
  description: string;
  type: RewardType;
  status: RewardStatus;
  amount?: number;
  currency?: string;
  xpValue?: number;
  expiresAt?: string;
  claimedAt?: string;
  iconUrl?: string;
}

interface RewardsSummary {
  totalClaimed: number;
  totalPending: number;
  totalXP: number;
  streakDays: number;
}

interface StreakDay {
  day: string;
  done: boolean;
  isToday: boolean;
}

export default function Rewards(): JSX.Element {
  const { t } = useTranslation();
  const { isConnected } = useWalletStore();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [summary, setSummary] = useState<RewardsSummary | null>(null);
  const [streak, setStreak] = useState<StreakDay[]>([]);
  const [activeTab, setActiveTab] = useState<RewardTab>('available');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const fetchRewards = useCallback(async (): Promise<void> => {
    if (!isConnected) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const [rewardsRes, summaryRes, streakRes] = await Promise.all([
        fetch('/api/v1/rewards?limit=100'),
        fetch('/api/v1/rewards/summary'),
        fetch('/api/v1/rewards/streak'),
      ]);
      if (!rewardsRes.ok) throw new Error('Failed to fetch rewards');
      if (!summaryRes.ok) throw new Error('Failed to fetch summary');
      if (!streakRes.ok) throw new Error('Failed to fetch streak');
      const rewardsData: Reward[] = await rewardsRes.json();
      const summaryData: RewardsSummary = await summaryRes.json();
      const streakData: StreakDay[] = await streakRes.json();
      setRewards(rewardsData);
      setSummary(summaryData);
      setStreak(streakData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('rewards.error'));
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, t]);

  useEffect(() => {
    void fetchRewards();
  }, [fetchRewards]);

  const handleClaim = useCallback(
    async (rewardId: string): Promise<void> => {
      try {
        setClaimingId(rewardId);
        setError(null);
        const res = await fetch(`/api/v1/rewards/${rewardId}/claim`, { method: 'POST' });
        if (!res.ok) throw new Error('Claim failed');
        setRewards((prev) =>
          prev.map((r) =>
            r.id === rewardId
              ? { ...r, status: 'claimed', claimedAt: new Date().toISOString() }
              : r
          )
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : t('rewards.claimError'));
      } finally {
        setClaimingId(null);
      }
    },
    [t]
  );

  const filteredRewards = rewards.filter((r) => {
    if (activeTab === 'available') return r.status === 'available';
    if (activeTab === 'claimed') return r.status === 'claimed';
    return true;
  });

  if (!isConnected) {
    return (
      <div className={styles.container}>
        <div className={styles.errorWrapper}>
          <EmptyState
            icon='gift'
            title={t('rewards.unauthorized.title')}
            description={t('rewards.unauthorized.description')}
          />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>{t('rewards.title')}</h1>
          <p className={styles.subtitle}>{t('rewards.subtitle')}</p>
        </header>
        <div className={styles.summaryGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className={styles.summaryCard} padded>
              <Skeleton variant='text' width='80px' height={14} />
              <Skeleton variant='text' width='100px' height={24} />
            </Card>
          ))}
        </div>
        <div className={styles.loadingWrapper}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className={styles.rewardCard} padded>
              <div className={styles.rewardRow}>
                <Skeleton variant='circle' size={44} />
                <div className={styles.rewardSkeletonInfo}>
                  <Skeleton variant='text' width='60%' height={16} />
                  <Skeleton variant='text' width='40%' height={14} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error && rewards.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.errorWrapper}>
          <EmptyState
            icon='error'
            title={t('rewards.errorTitle')}
            description={error}
            action={
              <Button variant='primary' onClick={fetchRewards}>{t('common.retry')}</Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('rewards.title')}</h1>
        <p className={styles.subtitle}>{t('rewards.subtitle')}</p>
      </header>

      {summary && (
        <div className={styles.summaryGrid}>
          <Card className={styles.summaryCard} padded>
            <span className={styles.summaryLabel}>{t('rewards.summary.claimed')}</span>
            <PriceDisplay value={summary.totalClaimed} currency='USD' className={styles.summaryValue} />
          </Card>
          <Card className={styles.summaryCard} padded>
            <span className={styles.summaryLabel}>{t('rewards.summary.pending')}</span>
            <PriceDisplay
              value={summary.totalPending}
              currency='USD'
              className={`${styles.summaryValue} ${styles.summaryValueHighlight}`}
            />
          </Card>
          <Card className={styles.summaryCard} padded>
            <span className={styles.summaryLabel}>{t('rewards.summary.xp')}</span>
            <span className={`${styles.summaryValue} ${styles.summaryValueHighlight}`}>
              {formatCompactNumber(summary.totalXP)} XP
            </span>
          </Card>
          <Card className={styles.summaryCard} padded>
            <span className={styles.summaryLabel}>{t('rewards.summary.streak')}</span>
            <span className={styles.summaryValue}>
              {summary.streakDays} {t('rewards.days')}
            </span>
          </Card>
        </div>
      )}

      {streak.length > 0 && (
        <Card className={styles.streakCard} padded>
          <div className={styles.streakHeader}>
            <h3 className={styles.streakTitle}>{t('rewards.streak.title')}</h3>
            <span className={styles.streakValue}>
              {summary?.streakDays ?? 0} {t('rewards.streak.days')}
            </span>
          </div>
          <div className={styles.streakDays}>
            {streak.map((day) => (
              <div key={day.day} className={styles.streakDay}>
                <div
                  className={`${styles.streakDayDot} ${
                    day.done
                      ? styles.streakDayDone
                      : day.isToday
                        ? styles.streakDayToday
                        : styles.streakDayMissed
                  }`}
                >
                  {day.done ? '✓' : day.isToday ? '·' : ''}
                </div>
                <span className={styles.streakDayLabel}>{day.day}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className={styles.tabs}>
        <div className={styles.tabList} role='tablist' aria-label={t('rewards.tabs.label')}>
          {(['available', 'claimed', 'achievements'] as const).map((tab) => (
            <button
              key={tab}
              className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab(tab)}
              role='tab'
              aria-selected={activeTab === tab}
              type='button'
            >
              {t(`rewards.tabs.${tab}`)}
            </button>
          ))}
        </div>
        <div className={styles.tabPanel}>
          {activeTab === 'achievements' ? (
            <Achievements />
          ) : filteredRewards.length > 0 ? (
            <ul className={styles.rewardsList} role='list'>
              {filteredRewards.map((reward) => (
                <li key={reward.id}>
                  <RewardCard
                    reward={reward}
                    onClaim={handleClaim}
                    isClaiming={claimingId === reward.id}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon='gift'
              title={t(`rewards.empty.${activeTab}.title`)}
              description={t(`rewards.empty.${activeTab}.description`)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

