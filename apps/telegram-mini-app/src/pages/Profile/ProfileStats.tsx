import { Card, PriceDisplay, AssetIcon } from '@cryptra/ui';
import { useTranslation } from '@cryptra/i18n';
import { formatCompactNumber } from '@cryptra/core';
import styles from './Profile.module.css';

interface UserStats {
  totalVolume: number;
  totalTrades: number;
  totalSwaps: number;
  referralCount: number;
  streakDays: number;
}

interface StatItem {
  id: string;
  labelKey: string;
  value: number;
  format: 'currency' | 'number' | 'compact';
  icon: string;
  currency?: string;
}

export default function ProfileStats({ stats }: { stats: UserStats }): JSX.Element {
  const { t } = useTranslation();

  const statItems: StatItem[] = [
    {
      id: 'volume',
      labelKey: 'profile.stats.totalVolume',
      value: stats.totalVolume,
      format: 'currency',
      icon: 'chart-bar',
      currency: 'USD',
    },
    {
      id: 'trades',
      labelKey: 'profile.stats.totalTrades',
      value: stats.totalTrades,
      format: 'compact',
      icon: 'trade',
    },
    {
      id: 'swaps',
      labelKey: 'profile.stats.totalSwaps',
      value: stats.totalSwaps,
      format: 'compact',
      icon: 'swap',
    },
    {
      id: 'referrals',
      labelKey: 'profile.stats.referrals',
      value: stats.referralCount,
      format: 'number',
      icon: 'users',
    },
    {
      id: 'streak',
      labelKey: 'profile.stats.streak',
      value: stats.streakDays,
      format: 'number',
      icon: 'fire',
    },
  ];

  const formatValue = (item: StatItem): string => {
    switch (item.format) {
      case 'currency':
        return `$${formatCompactNumber(item.value)}`;
      case 'compact':
        return formatCompactNumber(item.value);
      case 'number':
        return item.value.toLocaleString();
      default:
        return String(item.value);
    }
  };

  return (
    <div className={styles.statsGrid}>
      {statItems.map((item) => (
        <Card key={item.id} className={styles.statCard} padded>
          <div className={styles.statContent}>
            <div className={`${styles.statIconWrapper} ${styles[`statIcon${item.id}`]}`}>
              <AssetIcon name={item.icon} size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>
                {item.format === 'currency' && item.currency ? (
                  <PriceDisplay value={item.value} currency={item.currency} compact />
                ) : (
                  formatValue(item)
                )}
              </span>
              <span className={styles.statLabel}>{t(item.labelKey)}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

