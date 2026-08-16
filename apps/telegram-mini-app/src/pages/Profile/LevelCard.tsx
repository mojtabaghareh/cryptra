import { Card, Badge, AssetIcon } from '@cryptra/ui';
import { useTranslation } from '@cryptra/i18n';
import styles from './Profile.module.css';

type Tier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

interface LevelCardProps {
  level: number;
  tier: Tier;
  currentXP: number;
  requiredXP: number;
}

const TIER_CONFIG: Record<Tier, { icon: string; color: string; nextTier?: Tier }> = {
  bronze: { icon: 'tier-bronze', color: '#cd7f32', nextTier: 'silver' },
  silver: { icon: 'tier-silver', color: '#c0c0c0', nextTier: 'gold' },
  gold: { icon: 'tier-gold', color: '#ffd700', nextTier: 'platinum' },
  platinum: { icon: 'tier-platinum', color: '#e5e4e2', nextTier: 'diamond' },
  diamond: { icon: 'tier-diamond', color: '#b9f2ff', nextTier: undefined },
};

export default function LevelCard({
  level,
  tier,
  currentXP,
  requiredXP,
}: LevelCardProps): JSX.Element {
  const { t } = useTranslation();
  const config = TIER_CONFIG[tier];
  const nextTier = config.nextTier;
  const xpToNext = Math.max(0, requiredXP - currentXP);

  return (
    <Card className={styles.levelCard} padded>
      <div className={styles.levelCardContent}>
        <div className={styles.levelIconWrapper} style={{ color: config.color }}>
          <AssetIcon name={config.icon} size={48} />
        </div>
        <div className={styles.levelInfo}>
          <div className={styles.levelHeader}>
            <h3 className={styles.levelTitle}>
              {t(`profile.tier.${tier}`)}
            </h3>
            <Badge variant="primary" size="sm" className={styles.levelNumberBadge}>
              {t('profile.level.number', { level })}
            </Badge>
          </div>
          <p className={styles.levelDescription}>
            {t(`profile.tier.${tier}.description`)}
          </p>
          {nextTier && (
            <p className={styles.xpToNext}>
              {t('profile.xp.toNext', {
                amount: xpToNext,
                tier: t(`profile.tier.${nextTier}`),
              })}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

