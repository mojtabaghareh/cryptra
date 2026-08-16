import { useEffect, useState, useCallback } from 'react';
import { Card, Skeleton, Avatar, Badge, Button } from '@cryptra/ui';
import { useTranslation } from '@cryptra/i18n';
import { useWalletStore } from '@cryptra/wallets';
import LevelCard from './LevelCard';
import XPProgress from './XPProgress';
import FeeTier from './FeeTier';
import ProfileStats from './ProfileStats';
import styles from './Profile.module.css';

interface UserProfile {
  username: string;
  displayName: string;
  avatarUrl?: string;
  level: number;
  currentXP: number;
  requiredXP: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  feeDiscount: number;
  joinedAt: string;
}

interface UserStats {
  totalVolume: number;
  totalTrades: number;
  totalSwaps: number;
  referralCount: number;
  streakDays: number;
}

export default function Profile(): JSX.Element {
  const { t } = useTranslation();
  const { isConnected, address } = useWalletStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const [profileRes, statsRes] = await Promise.all([
        fetch('/api/v1/user/profile'),
        fetch('/api/v1/user/stats'),
      ]);
      if (!profileRes.ok) throw new Error('Failed to fetch profile');
      if (!statsRes.ok) throw new Error('Failed to fetch stats');
      const profileData: UserProfile = await profileRes.json();
      const statsData: UserStats = await statsRes.json();
      setProfile(profileData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profile.error'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  if (!isConnected) {
    return (
      <div className={styles.container}>
        <div className={styles.unauthorized}>
          <Avatar size="xl" fallback="?" />
          <h2 className={styles.unauthorizedTitle}>{t('profile.unauthorized.title')}</h2>
          <p className={styles.unauthorizedText}>{t('profile.unauthorized.description')}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <header className={styles.headerLoading}>
          <Skeleton variant="circle" size={80} />
          <Skeleton variant="text" width="160px" height={24} />
          <Skeleton variant="text" width="120px" height={16} />
        </header>
        <div className={styles.grid}>
          <Skeleton variant="rect" height={120} />
          <Skeleton variant="rect" height={120} />
          <Skeleton variant="rect" height={160} />
          <Skeleton variant="rect" height={200} />
        </div>
      </div>
    );
  }

  if (error || !profile || !stats) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p className={styles.errorText}>{error ?? t('profile.error')}</p>
          <Button variant="primary" onClick={fetchProfile}>
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  const xpPercentage = Math.min(100, Math.round((profile.currentXP / profile.requiredXP) * 100));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.avatarWrapper}>
          <Avatar
            src={profile.avatarUrl}
            alt={profile.displayName}
            size="xl"
            fallback={profile.displayName.charAt(0).toUpperCase()}
          />
          <Badge variant="primary" size="sm" className={styles.levelBadge}>
            Lv.{profile.level}
          </Badge>
        </div>
        <h1 className={styles.displayName}>{profile.displayName}</h1>
        <p className={styles.username}>@{profile.username}</p>
        {address && (
          <code className={styles.address}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </code>
        )}
      </header>

      <section className={styles.levelSection} aria-label={t('profile.level.label')}>
        <LevelCard
          level={profile.level}
          tier={profile.tier}
          currentXP={profile.currentXP}
          requiredXP={profile.requiredXP}
        />
      </section>

      <section className={styles.xpSection} aria-label={t('profile.xp.label')}>
        <XPProgress
          currentXP={profile.currentXP}
          requiredXP={profile.requiredXP}
          percentage={xpPercentage}
        />
      </section>

      <section className={styles.feeSection} aria-label={t('profile.fee.label')}>
        <FeeTier
          tier={profile.tier}
          feeDiscount={profile.feeDiscount}
        />
      </section>

      <section className={styles.statsSection} aria-label={t('profile.stats.label')}>
        <h2 className={styles.sectionTitle}>{t('profile.stats.title')}</h2>
        <ProfileStats stats={stats} />
      </section>

      <footer className={styles.footer}>
        <p className={styles.joinDate}>
          {t('profile.joinedAt', { date: new Date(profile.joinedAt).toLocaleDateString() })}
        </p>
      </footer>
    </div>
  );
}

