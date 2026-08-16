import { Card, AssetIcon, Badge } from '@cryptra/ui';
import { useTranslation } from '@cryptra/i18n';
import { formatDateRelative } from '@cryptra/core';
import styles from './GlobalActivity.module.css';

type ActivityType = 'all' | 'swap' | 'trade' | 'stake' | 'claim' | 'referral';

interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  chain: string;
  isAggregated: boolean;
  count?: number;
}

const TYPE_CONFIG: Record<
  ActivityType,
  { icon: string; variant: 'primary' | 'success' | 'warning' | 'info' | 'neutral' }
> = {
  all: { icon: 'activity', variant: 'neutral' },
  swap: { icon: 'swap', variant: 'primary' },
  trade: { icon: 'trade', variant: 'warning' },
  stake: { icon: 'shield', variant: 'success' },
  claim: { icon: 'check', variant: 'info' },
  referral: { icon: 'users', variant: 'neutral' },
};

interface ActivityListProps {
  activities: ActivityItem[];
}

export default function ActivityList({ activities }: ActivityListProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <ul className={styles.activityList} role='list' aria-label={t('activity.listLabel')}>
      {activities.map((activity) => {
        const config = TYPE_CONFIG[activity.type];
        return (
          <li key={activity.id}>
            <Card className={styles.activityCard} padded>
              <div className={styles.activityRow}>
                <div
                  className={`${styles.activityIconWrapper} ${
                    styles[`activityIcon${config.variant}`]
                  }`}
                >
                  <AssetIcon name={config.icon} size={18} />
                </div>
                <div className={styles.activityContent}>
                  <div className={styles.activityHeader}>
                    <span className={styles.activityDesc}>{activity.description}</span>
                    {activity.isAggregated && activity.count && activity.count > 1 && (
                      <Badge variant='neutral' size='xs'>
                        +{activity.count}
                      </Badge>
                    )}
                  </div>
                  <div className={styles.activityMeta}>
                    <Badge variant='neutral' size='xs'>{activity.chain}</Badge>
                    <span className={styles.activityTime}>
                      {formatDateRelative(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

