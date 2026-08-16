import { Card, PriceDisplay } from '@cryptra/ui';
import { useTranslation } from '@cryptra/i18n';
import { formatCompactNumber } from '@cryptra/core';
import styles from './Referral.module.css';

interface ReferralStatsProps {
  data: {
    totalInvited: number;
    pending: number;
    active: number;
    totalEarnings: number;
    pendingEarnings: number;
    tier: string;
  };
}

export default function ReferralStats({ data }: ReferralStatsProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className={styles.statsGrid}>
      <Card className={styles.statCard} padded>
        <span className={styles.statLabel}>{t('referral.stats.totalEarnings')}</span>
        <PriceDisplay value={data.totalEarnings} currency='USD' className={styles.statValue} />
      </Card>
      <Card className={styles.statCard} padded>
        <span className={styles.statLabel}>{t('referral.stats.pendingEarnings')}</span>
        <PriceDisplay value={data.pendingEarnings} currency='USD' className={styles.statValue} />
      </Card>
      <Card className={styles.statCard} padded>
        <span className={styles.statLabel}>{t('referral.stats.conversion')}</span>
        <span className={styles.statValue}>
          {data.totalInvited > 0 ? ((data.active / data.totalInvited) * 100).toFixed(1) : '0'}%
        </span>
      </Card>
      <Card className={styles.statCard} padded>
        <span className={styles.statLabel}>{t('referral.stats.tier')}</span>
        <span className={`${styles.statValue} ${styles.tierValue}`}>{data.tier}</span>
      </Card>
    </div>
  );
}

