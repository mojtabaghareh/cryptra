import { Card, Badge, AssetIcon } from '@cryptra/ui';
import { useTranslation } from '@cryptra/i18n';
import { formatPercentage } from '@cryptra/core';
import styles from './Profile.module.css';

type Tier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

interface FeeTierProps {
  tier: Tier;
  feeDiscount: number;
}

const TIER_BENEFITS: Record<Tier, string[]> = {
  bronze: ['fee.benefit.basic', 'fee.benefit.support'],
  silver: ['fee.benefit.reduced', 'fee.benefit.priority', 'fee.benefit.support'],
  gold: ['fee.benefit.highReduced', 'fee.benefit.priority', 'fee.benefit.early', 'fee.benefit.support'],
  platinum: ['fee.benefit.majorReduced', 'fee.benefit.priorityPlus', 'fee.benefit.early', 'fee.benefit.dedicated'],
  diamond: ['fee.benefit.minimal', 'fee.benefit.vip', 'fee.benefit.early', 'fee.benefit.dedicated', 'fee.benefit.governance'],
};

export default function FeeTier({
  tier,
  feeDiscount,
}: FeeTierProps): JSX.Element {
  const { t } = useTranslation();
  const benefits = TIER_BENEFITS[tier];
  const effectiveFee = Math.max(0, 0.3 - feeDiscount);

  return (
    <Card className={styles.feeCard} padded>
      <div className={styles.feeHeader}>
        <div className={styles.feeIconWrapper}>
          <AssetIcon name="fee-discount" size={32} />
        </div>
        <div className={styles.feeTitleGroup}>
          <h3 className={styles.feeTitle}>{t('profile.fee.title')}</h3>
          <Badge variant="success" size="sm">
            {t(`profile.tier.${tier}`)}
          </Badge>
        </div>
      </div>

      <div className={styles.feeBreakdown}>
        <div className={styles.feeRow}>
          <span className={styles.feeLabel}>{t('profile.fee.baseRate')}</span>
          <span className={styles.feeValue}>0.3%</span>
        </div>
        <div className={styles.feeRow}>
          <span className={styles.feeLabel}>{t('profile.fee.yourDiscount')}</span>
          <span className={`${styles.feeValue} ${styles.feeDiscount}`}>
            -{formatPercentage(feeDiscount)}
          </span>
        </div>
        <div className={`${styles.feeRow} ${styles.feeRowHighlight}`}>
          <span className={styles.feeLabel}>{t('profile.fee.yourRate')}</span>
          <span className={`${styles.feeValue} ${styles.feeEffective}`}>
            {effectiveFee.toFixed(3)}%
          </span>
        </div>
      </div>

      <div className={styles.benefitsSection}>
        <h4 className={styles.benefitsTitle}>{t('profile.fee.benefits')}</h4>
        <ul className={styles.benefitsList} role="list">
          {benefits.map((benefitKey, index) => (
            <li key={index} className={styles.benefitItem}>
              <AssetIcon name="check" size={16} className={styles.benefitIcon} />
              <span>{t(`profile.${benefitKey}`)}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

