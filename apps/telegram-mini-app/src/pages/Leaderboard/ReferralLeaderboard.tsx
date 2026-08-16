import { useCallback, useEffect, useState } from 'react';
import { Card, Skeleton, Badge, Avatar, Button, EmptyState } from '@cryptra/ui';
import { useTranslation } from '@cryptra/i18n';
import { formatCompactNumber } from '@cryptra/core';
import styles from './Leaderboard.module.css';

interface ReferralLeader {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  referralCount: number;
  activeReferrals: number;
  referralVolume: number;
  referralEarnings: number;
}

export default function ReferralLeaderboard(): JSX.Element {
  const { t } = useTranslation();
  const [leaders, setLeaders] = useState<ReferralLeader[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'all' | 'week' | 'month'>('all');

  const fetchLeaders = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/v1/leaderboard/referral?timeframe=${timeframe}&limit=50`);
      if (!res.ok) throw new Error('Failed');
      const data: ReferralLeader[] = await res.json();
      setLeaders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('leaderboard.error'));
    } finally {
      setIsLoading(false);
    }
  }, [timeframe, t]);

  useEffect(() => {
    void fetchLeaders();
  }, [fetchLeaders]);

  const getRankStyle = (rank: number): string => {
    if (rank === 1) return styles.rankGold;
    if (rank === 2) return styles.rankSilver;
    if (rank === 3) return styles.rankBronze;
    return styles.rankNormal;
  };

  if (isLoading) {
    return (
      <div className={styles.boardLoading}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className={styles.leaderCard} padded>
            <div className={styles.leaderRow}>
              <Skeleton variant='circle' size={40} />
              <div className={styles.leaderSkeletonInfo}>
                <Skeleton variant='text' width='120px' height={16} />
                <Skeleton variant='text' width='80px' height={14} />
              </div>
              <Skeleton variant='text' width='60px' height={16} />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon='error'
        title={t('leaderboard.errorTitle')}
        description={error}
        action={
          <Button variant='primary' onClick={fetchLeaders}>{t('common.retry')}</Button>
        }
      />
    );
  }

  return (
    <div className={styles.boardContainer}>
      <div className={styles.timeframeFilter}>
        {(['all', 'week', 'month'] as const).map((tf) => (
          <button
            key={tf}
            className={`${styles.timeframeBtn} ${timeframe === tf ? styles.timeframeBtnActive : ''}`}
            onClick={() => setTimeframe(tf)}
            type='button'
          >
            {t(`leaderboard.timeframe.${tf}`)}
          </button>
        ))}
      </div>

      <ul className={styles.leaderList} role='list'>
        {leaders.map((leader) => (
          <li key={leader.userId}>
            <Card
              className={`${styles.leaderCard} ${leader.rank <= 3 ? styles.leaderCardTop : ''}`}
              padded
            >
              <div className={styles.leaderRow}>
                <span className={`${styles.rankBadge} ${getRankStyle(leader.rank)}`}>
                  {leader.rank}
                </span>
                <Avatar
                  src={leader.avatarUrl}
                  alt={leader.displayName}
                  size='md'
                  fallback={leader.displayName.charAt(0).toUpperCase()}
                />
                <div className={styles.leaderInfo}>
                  <span className={styles.leaderName}>{leader.displayName}</span>
                  <span className={styles.leaderMeta}>@{leader.username}</span>
                </div>
                <div className={styles.leaderStats}>
                  <Badge variant='success' size='xs'>
                    {leader.activeReferrals} {t('leaderboard.active')}
                  </Badge>
                  <span className={styles.referralCount}>
                    {formatCompactNumber(leader.referralCount)} {t('leaderboard.invited')}
                  </span>
                  <span className={styles.earningsText}>
                    {formatCompactNumber(leader.referralEarnings)} USD {t('leaderboard.earned')}
                  </span>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      {leaders.length === 0 && (
        <EmptyState
          icon='empty-list'
          title={t('leaderboard.emptyTitle')}
          description={t('leaderboard.emptyDescription')}
        />
      )}
    </div>
  );
}

