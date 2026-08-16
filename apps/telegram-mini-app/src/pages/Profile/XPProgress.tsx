import { Card, ProgressBar } from '@cryptra/ui';
import { useTranslation } from '@cryptra/i18n';
import styles from './Profile.module.css';

interface XPProgressProps {
  currentXP: number;
  requiredXP: number;
  percentage: number;
}

export default function XPProgress({
  currentXP,
  requiredXP,
  percentage,
}: XPProgressProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Card className={styles.xpCard} padded>
      <div className={styles.xpHeader}>
        <h3 className={styles.xpTitle}>{t('profile.xp.title')}</h3>
        <span className={styles.xpFraction}>
          {currentXP.toLocaleString()} / {requiredXP.toLocaleString()} {t('profile.xp.unit')}
        </span>
      </div>
      <ProgressBar
        value={percentage}
        max={100}
        className={styles.xpProgressBar}
        aria-label={t('profile.xp.progressLabel')}
      />
      <div className={styles.xpLabels}>
        <span className={styles.xpPercentage}>{percentage}%</span>
        <span className={styles.xpRemaining}>
          {t('profile.xp.remaining', { amount: Math.max(0, requiredXP - currentXP) })}
        </span>
      </div>
    </Card>
  );
}

