import { useState, useCallback, useEffect } from 'react';
import { Card, Skeleton, Button, Badge, EmptyState } from '@cryptra/ui';
import { useTranslation } from '@cryptra/i18n';
import ActivityFilters from './ActivityFilters';
import ActivityList from './ActivityList';
import styles from './GlobalActivity.module.css';

type ActivityType = 'all' | 'swap' | 'trade' | 'stake' | 'claim' | 'referral';
type ActivityTimeframe = '1h' | '24h' | '7d' | '30d';

interface GlobalActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  chain: string;
  isAggregated: boolean;
  count?: number;
}

export default function GlobalActivity(): JSX.Element {
  const { t } = useTranslation();
  const [activities, setActivities] = useState<GlobalActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ActivityType>('all');
  const [timeframe, setTimeframe] = useState<ActivityTimeframe>('24h');
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);

  const fetchActivities = useCallback(
    async (pageNum: number): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(
          `/api/v1/activity/global?type=${filter}&timeframe=${timeframe}&page=${pageNum}&limit=30`
        );
        if (!res.ok) throw new Error('Failed');
        const data: { items: GlobalActivityItem[]; hasMore: boolean } = await res.json();
        setActivities((prev) => (pageNum === 1 ? data.items : [...prev, ...data.items]));
        setHasMore(data.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('activity.error'));
      } finally {
        setIsLoading(false);
      }
    },
    [filter, timeframe, t]
  );

  useEffect(() => {
    setPage(1);
    void fetchActivities(1);
  }, [fetchActivities]);

  const handleLoadMore = useCallback((): void => {
    const next = page + 1;
    setPage(next);
    void fetchActivities(next);
  }, [page, fetchActivities]);

  const handleFilterChange = (f: ActivityType): void => {
    setFilter(f);
    setPage(1);
  };

  const handleTimeframeChange = (tf: ActivityTimeframe): void => {
    setTimeframe(tf);
    setPage(1);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('activity.title')}</h1>
        <p className={styles.subtitle}>{t('activity.subtitle')}</p>
      </header>

      <ActivityFilters
        filter={filter}
        timeframe={timeframe}
        onFilterChange={handleFilterChange}
        onTimeframeChange={handleTimeframeChange}
      />

      {isLoading && activities.length === 0 ? (
        <div className={styles.loadingWrapper}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className={styles.activityCard} padded>
              <div className={styles.activityRow}>
                <Skeleton variant='circle' size={36} />
                <div className={styles.activitySkeletonInfo}>
                  <Skeleton variant='text' width='70%' height={14} />
                  <Skeleton variant='text' width='40%' height={12} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : error && activities.length === 0 ? (
        <EmptyState
          icon='error'
          title={t('activity.errorTitle')}
          description={error}
          action={
            <Button variant='primary' onClick={() => void fetchActivities(1)}>{t('common.retry')}</Button>
          }
        />
      ) : (
        <>
          <div className={styles.privacyNote}>
            <Badge variant='info' size='xs'>{t('activity.privacy')}</Badge>
            <p>{t('activity.privacyDesc')}</p>
          </div>
          <ActivityList activities={activities} />
          {hasMore && (
            <div className={styles.loadMoreWrapper}>
              <Button
                variant='outline'
                onClick={handleLoadMore}
                loading={isLoading}
                disabled={isLoading}
              >
                {t('common.loadMore')}
              </Button>
            </div>
          )}
          {activities.length === 0 && (
            <EmptyState
              icon='empty-list'
              title={t('activity.emptyTitle')}
              description={t('activity.emptyDescription')}
            />
          )}
        </>
      )}
    </div>
  );
}

