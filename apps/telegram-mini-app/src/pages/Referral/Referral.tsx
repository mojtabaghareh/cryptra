import { useState, useCallback, useEffect } from 'react';
import { Card, Button, Badge, Skeleton, Alert, EmptyState } from '@cryptra/ui';
import { useTranslation } from '@cryptra/i18n';
import { useWalletStore } from '@cryptra/wallets';
import { formatCompactNumber } from '@cryptra/core';
import ReferralStats from './ReferralStats';
import ReferralMilestones from './ReferralMilestones';
import styles from './Referral.module.css';

interface ReferralData {
  code: string;
  link: string;
  totalInvited: number;
  pending: number;
  active: number;
  totalEarnings: number;
  pendingEarnings: number;
  tier: string;
}

export default function Referral(): JSX.Element {
  const { t } = useTranslation();
  const { isConnected } = useWalletStore();

  const [data, setData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/v1/referral');
      if (!res.ok) throw new Error('Failed');
      const d: ReferralData = await res.json();
      setData(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('referral.error'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isConnected) void fetchData();
    else setIsLoading(false);
  }, [fetchData, isConnected]);

  const handleCopy = async (): Promise<void> => {
    if (!data?.link) return;
    try {
      await navigator.clipboard.writeText(data.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t('referral.copyFailed'));
    }
  };

  const handleShare = async (): Promise<void> => {
    if (!data?.link) return;
    try {
      await navigator.share({
        title: t('referral.shareTitle'),
        text: t('referral.shareText'),
        url: data.link,
      });
    } catch {
      /* user cancelled */
    }
  };

  if (!isConnected) {
    return (
      <div className={styles.container}>
        <div className={styles.unauthorized}>
          <EmptyState
            icon='users'
            title={t('referral.unauthorized.title')}
            description={t('referral.unauthorized.description')}
          />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeletonWrapper}>
          <Skeleton variant='rect' height={120} />
          <Skeleton variant='rect' height={80} />
          <Skeleton variant='rect' height={200} />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.container}>
        <div className={styles.errorWrapper}>
          <Alert variant='error'>{error ?? t('referral.error')}</Alert>
          <Button variant='primary' onClick={fetchData}>{t('common.retry')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('referral.title')}</h1>
        <p className={styles.subtitle}>{t('referral.subtitle')}</p>
      </header>

      <Card className={styles.codeCard} padded>
        <div className={styles.codeSection}>
          <span className={styles.codeLabel}>{t('referral.yourCode')}</span>
          <div className={styles.codeBox}>
            <code className={styles.codeValue}>{data.code}</code>
            <Button variant='outline' size='sm' onClick={() => { void handleCopy(); }}>
              {copied ? t('referral.copied') : t('referral.copy')}
            </Button>
          </div>
        </div>
        <div className={styles.linkSection}>
          <span className={styles.codeLabel}>{t('referral.yourLink')}</span>
          <div className={styles.linkBox}>
            <span className={styles.linkValue}>{data.link}</span>
            {typeof navigator.share === 'function' && (
              <Button variant='primary' size='sm' onClick={() => { void handleShare(); }}>
                {t('referral.share')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <ReferralStats data={data} />
      <ReferralMilestones currentInvited={data.totalInvited} tier={data.tier} />

      <Card className={styles.statusCard} padded>
        <h3 className={styles.statusTitle}>{t('referral.status.title')}</h3>
        <div className={styles.statusGrid}>
          <div className={styles.statusItem}>
            <Badge variant='neutral' size='md' className={styles.statusBadge}>{data.totalInvited}</Badge>
            <span className={styles.statusLabel}>{t('referral.status.total')}</span>
          </div>
          <div className={styles.statusItem}>
            <Badge variant='warning' size='md' className={styles.statusBadge}>{data.pending}</Badge>
            <span className={styles.statusLabel}>{t('referral.status.pending')}</span>
          </div>
          <div className={styles.statusItem}>
            <Badge variant='success' size='md' className={styles.statusBadge}>{data.active}</Badge>
            <span className={styles.statusLabel}>{t('referral.status.active')}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

