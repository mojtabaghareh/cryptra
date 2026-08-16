import { useCallback, useEffect, useState } from 'react';
import { Card, Skeleton, ProgressBar, Badge, Button, EmptyState } from '@cryptra/ui';
import { useTranslation } from '@cryptra/i18n';
import { formatCompactNumber } from '@cryptra/core';
import styles from './Rewards.module.css';

type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress: number;
  target: number;
  rewardXP: number;
}

export default function Achievements(): JSX.Element {
  const { t } = useTranslation();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievements = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/v1/achievements?limit=100');
      if (!res.ok) throw new Error('Failed');
      const data: Achievement[] = await res.json();
      setAchievements(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('achievements.error'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchAchievements();
  }, [fetchAchievements]);

  const rarityColor: Record<AchievementRarity, string> = {
    common: '#8b8d97',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f59e0b',
  };

  if (isLoading) {
    return (
      <div className={styles.achievementsGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className={styles.achievementCard} padded>
            <Skeleton variant='circle' size={40} />
            <Skeleton variant='text' width='80%' height={16} />
            <Skeleton variant='text' width='60%' height={12} />
            <Skeleton variant='rect' height={6} />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon='error'
        title={t('achievements.errorTitle')}
        description={error}
        action={
          <Button variant='primary' onClick={fetchAchievements}>{t('common.retry')}</Button>
        }
      />
    );
  }

  return (
    <div className={styles.achievementsGrid} role='list'>
      {achievements.map((ach) => (
        <Card
          key={ach.id}
          className={`${styles.achievementCard} ${ach.isUnlocked ? styles.achievementCardUnlocked : ''}`}
          padded
          role='listitem'
        >
          <div
            className={`${styles.achievementIcon} ${
              ach.isUnlocked ? styles.achievementIconUnlocked : styles.achievementIconLocked
            }`}
          >
            {ach.icon}
          </div>
          <span className={styles.achievementName}>{ach.name}</span>
          <span className={styles.achievementDesc}>{ach.description}</span>
          <Badge
            variant='neutral'
            size='xs'
            style={{ color: rarityColor[ach.rarity], borderColor: rarityColor[ach.rarity] }}
          >
            {t(`achievements.rarity.${ach.rarity}`)}
          </Badge>
          {!ach.isUnlocked && ach.target > 0 && (
            <div className={styles.achievementProgressWrapper}>
              <div className={styles.achievementProgressLabel}>
                <span>{t('achievements.progress')}</span>
                <span className={styles.achievementProgressValue}>
                  {formatCompactNumber(ach.progress)} / {formatCompactNumber(ach.target)}
                </span>
              </div>
              <ProgressBar
                value={ach.progress}
                max={ach.target}
                aria-label={t('achievements.progressLabel', { name: ach.name })}
              />
            </div>
          )}
          {ach.isUnlocked && (
            <span className={styles.achievementReward}>
              +{ach.rewardXP} XP
            </span>
          )}
        </Card>
      ))}
    </div>
  );
}

