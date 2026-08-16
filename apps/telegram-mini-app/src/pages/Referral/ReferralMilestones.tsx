import { Card, ProgressBar, Badge } from '@cryptra/ui';
import { useTranslation } from '@cryptra/i18n';
import styles from './Referral.module.css';

interface Milestone {
  level: number;
  nameKey: string;
  required: number;
  reward: number;
}

const MILESTONES: Milestone[] = [
  { level: 1, nameKey: 'referral.milestone.bronze', required: 5, reward: 10 },
  { level: 2, nameKey: 'referral.milestone.silver', required: 25, reward: 50 },
  { level: 3, nameKey: 'referral.milestone.gold', required: 100, reward: 250 },
  { level: 4, nameKey: 'referral.milestone.platinum', required: 500, reward: 1500 },
  { level: 5, nameKey: 'referral.milestone.diamond', required: 2000, reward: 7500 },
];

interface ReferralMilestonesProps {
  currentInvited: number;
  tier: string;
}

export default function ReferralMilestones({ currentInvited, tier }: ReferralMilestonesProps): JSX.Element {
  const { t } = useTranslation();

  const currentTierIndex = MILESTONES.findIndex((m) => t(m.nameKey) === tier);
  const nextMilestone = MILESTONES[currentTierIndex + 1];
  const progress = nextMilestone ? Math.min(100, (currentInvited / nextMilestone.required) * 100) : 100;

  return (
    <Card className={styles.milestonesCard} padded>
      <h3 className={styles.milestonesTitle}>{t('referral.milestones.title')}</h3>
      <div className={styles.milestonesList}>
        {MILESTONES.map((ms, idx) => {
          const achieved = currentInvited >= ms.required;
          const isCurrent = idx === currentTierIndex;
          return (
            <div
              key={ms.level}
              className={`${styles.milestoneItem} ${achieved ? styles.milestoneAchieved : ''} ${isCurrent ? styles.milestoneCurrent : ''}`}
            >
              <div className={styles.milestoneHeader}>
                <Badge variant={achieved ? 'success' : 'neutral'} size='xs'>
                  Lv.{ms.level}
                </Badge>
                <span className={styles.milestoneName}>{t(ms.nameKey)}</span>
                <span className={styles.milestoneReward}>+{ms.reward} USD</span>
              </div>
              <div className={styles.milestoneProgress}>
                <span className={styles.milestoneRequired}>
                  {achieved ? t('referral.milestone.achieved') : `${currentInvited} / ${ms.required}`}
                </span>
                {achieved && <Badge variant='success' size='xs'>{t('referral.milestone.done')}</Badge>}
              </div>
            </div>
          );
        })}
      </div>
      {nextMilestone && (
        <div className={styles.nextMilestone}>
          <span className={styles.nextLabel}>
            {t('referral.milestone.next', { required: nextMilestone.required - currentInvited })}
          </span>
          <ProgressBar value={progress} max={100} aria-label={t('referral.milestone.progressLabel')} />
        </div>
      )}
    </Card>
  );
}

