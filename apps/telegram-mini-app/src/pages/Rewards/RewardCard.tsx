import { Card, Button, Badge } from '@cryptra/ui';
import { useTranslation } from '@cryptra/i18n';
import { formatDateRelative } from '@cryptra/core';
import styles from './Rewards.module.css';

type RewardType = 'token' | 'nft' | 'xp' | 'badge';
type RewardStatus = 'available' | 'claimed' | 'expired';

interface Reward {
  id: string;
  name: string;
  description: string;
  type: RewardType;
  status: RewardStatus;
  amount?: number;
  currency?: string;
  xpValue?: number;
  expiresAt?: string;
  claimedAt?: string;
  iconUrl?: string;
}

interface RewardCardProps {
  reward: Reward;
  onClaim: (rewardId: string) => void;
  isClaiming: boolean;
}

const TYPE_ICON_CLASS: Record<RewardType, string> = {
  token: styles.rewardIconToken,
  nft: styles.rewardIconNFT,
  xp: styles.rewardIconXP,
  badge: styles.rewardIconBadge,
};

const TYPE_ICON_NAME: Record<RewardType, string> = {
  token: 'token',
  nft: 'star',
  xp: 'zap',
  badge: 'award',
};

export default function RewardCard({ reward, onClaim, isClaiming }: RewardCardProps): JSX.Element {
  const { t } = useTranslation();

  const cardClass = [
    styles.rewardCard,
    reward.status === 'claimed' && styles.rewardCardClaimed,
    reward.status === 'expired' && styles.rewardCardExpired,
  ].filter(Boolean).join(' ');

  const displayAmount = (): string | null => {
    if (reward.amount && reward.currency) {
      return `${reward.amount} ${reward.currency}`;
    }
    if (reward.xpValue) {
      return `${reward.xpValue} XP`;
    }
    return null;
  };

  return (
    <Card className={cardClass} padded>
      <div className={styles.rewardRow}>
        <div className={`${styles.rewardIconWrapper} ${TYPE_ICON_CLASS[reward.type]}`}>
          {reward.iconUrl ? (
            <img src={reward.iconUrl} alt='' width={24} height={24} loading='lazy' />
          ) : (
            <span>{TYPE_ICON_NAME[reward.type]}</span>
          )}
        </div>
        <div className={styles.rewardContent}>
          <div className={styles.rewardHeader}>
            <span className={styles.rewardName}>{reward.name}</span>
            {reward.status === 'claimed' && (
              <Badge variant='success' size='xs'>{t('rewards.status.claimed')}</Badge>
            )}
            {reward.status === 'expired' && (
              <Badge variant='error' size='xs'>{t('rewards.status.expired')}</Badge>
            )}
          </div>
          <span className={styles.rewardDesc}>{reward.description}</span>
          <div className={styles.rewardMeta}>
            {displayAmount() && (
              <span className={styles.rewardAmount}>{displayAmount()}</span>
            )}
            {reward.expiresAt && reward.status === 'available' && (
              <span className={styles.rewardExpiry}>
                {t('rewards.expires')}: {formatDateRelative(reward.expiresAt)}
              </span>
            )}
            {reward.claimedAt && (
              <span className={styles.rewardExpiry}>
                {t('rewards.claimedAt')}: {formatDateRelative(reward.claimedAt)}
              </span>
            )}
          </div>
        </div>
        <div className={styles.rewardActions}>
          {reward.status === 'available' && (
            <Button
              variant='primary'
              size='sm'
              onClick={() => onClaim(reward.id)}
              loading={isClaiming}
              disabled={isClaiming}
            >
              {t('rewards.claim')}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

