import { useTranslation } from '@cryptra/i18n';
import styles from './GlobalActivity.module.css';

type ActivityType = 'all' | 'swap' | 'trade' | 'stake' | 'claim' | 'referral';
type ActivityTimeframe = '1h' | '24h' | '7d' | '30d';

interface ActivityFiltersProps {
  filter: ActivityType;
  timeframe: ActivityTimeframe;
  onFilterChange: (f: ActivityType) => void;
  onTimeframeChange: (tf: ActivityTimeframe) => void;
}

const ACTIVITY_TYPES: ActivityType[] = ['all', 'swap', 'trade', 'stake', 'claim', 'referral'];
const TIMEFRAMES: ActivityTimeframe[] = ['1h', '24h', '7d', '30d'];

export default function ActivityFilters({
  filter,
  timeframe,
  onFilterChange,
  onTimeframeChange,
}: ActivityFiltersProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.typeFilters} role='tablist' aria-label={t('activity.filter.typeLabel')}>
        {ACTIVITY_TYPES.map((type) => (
          <button
            key={type}
            className={`${styles.typeFilterBtn} ${filter === type ? styles.typeFilterBtnActive : ''}`}
            onClick={() => onFilterChange(type)}
            role='tab'
            aria-selected={filter === type}
            type='button'
          >
            {t(`activity.type.${type}`)}
          </button>
        ))}
      </div>
      <div className={styles.timeframeFilters} role='group' aria-label={t('activity.filter.timeframeLabel')}>
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            className={`${styles.timeframeFilterBtn} ${timeframe === tf ? styles.timeframeFilterBtnActive : ''}`}
            onClick={() => onTimeframeChange(tf)}
            type='button'
          >
            {t(`activity.timeframe.${tf}`)}
          </button>
        ))}
      </div>
    </div>
  );
}

