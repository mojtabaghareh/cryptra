import { useCallback, useEffect, useState } from 'react';
import { Card, Skeleton, Badge, Button, EmptyState, AssetIcon } from '@cryptra/ui';
import { useTranslation } from '@cryptra/i18n';
import { useWalletStore } from '@cryptra/wallets';
import { formatDateRelative, formatCryptoAmount, truncateHash } from '@cryptra/core';
import styles from './Wallet.module.css';

type TransactionType = 'send' | 'receive' | 'swap' | 'approve' | 'contract';

interface Transaction {
  id: string;
  hash: string;
  type: TransactionType;
  status: 'pending' | 'success' | 'failed';
  from: string;
  to: string;
  amount: number;
  symbol: string;
  decimals: number;
  fee: number;
  feeSymbol: string;
  timestamp: string;
  chain: string;
  direction: 'in' | 'out';
}

const TX_TYPE_CONFIG: Record<TransactionType, { icon: string; variant: 'primary' | 'success' | 'warning' | 'info' | 'neutral' }> = {
  send: { icon: 'send', variant: 'warning' },
  receive: { icon: 'receive', variant: 'success' },
  swap: { icon: 'swap', variant: 'primary' },
  approve: { icon: 'shield', variant: 'info' },
  contract: { icon: 'contract', variant: 'neutral' },
};

export default function WalletHistory(): JSX.Element {
  const { t } = useTranslation();
  const { address, chainId } = useWalletStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);

  const fetchHistory = useCallback(async (pageNum: number): Promise<void> => {
    if (!address) return;
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `/api/v1/wallet/history?address=${encodeURIComponent(address)}&chainId=${chainId ?? 1}&page=${pageNum}&limit=20`
      );
      if (!response.ok) throw new Error('Failed to fetch history');
      const data: { items: Transaction[]; hasMore: boolean } = await response.json();
      setTransactions((prev) => (pageNum === 1 ? data.items : [...prev, ...data.items]));
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('wallet.history.error'));
    } finally {
      setIsLoading(false);
    }
  }, [address, chainId, t]);

  useEffect(() => {
    void fetchHistory(1);
  }, [fetchHistory]);

  const handleLoadMore = useCallback((): void => {
    const nextPage = page + 1;
    setPage(nextPage);
    void fetchHistory(nextPage);
  }, [page, fetchHistory]);

  const getStatusVariant = (status: Transaction['status']): 'warning' | 'success' | 'error' => {
    switch (status) {
      case 'pending': return 'warning';
      case 'success': return 'success';
      case 'failed': return 'error';
    }
  };

  if (isLoading && transactions.length === 0) {
    return (
      <div className={styles.historyLoading}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className={styles.txCard} padded>
            <div className={styles.txCardContent}>
              <Skeleton variant="circle" size={40} />
              <div className={styles.txSkeletonInfo}>
                <Skeleton variant="text" width="100px" height={16} />
                <Skeleton variant="text" width="140px" height={14} />
              </div>
              <div className={styles.txSkeletonMeta}>
                <Skeleton variant="text" width="80px" height={16} />
                <Skeleton variant="text" width="60px" height={14} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <EmptyState
        icon="error"
        title={t('wallet.history.errorTitle')}
        description={error}
        action={
          <Button variant="primary" onClick={() => { void fetchHistory(1); }}>
            {t('common.retry')}
          </Button>
        }
      />
    );
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon="empty-list"
        title={t('wallet.history.emptyTitle')}
        description={t('wallet.history.emptyDescription')}
      />
    );
  }

  return (
    <div className={styles.historyContainer}>
      <ul className={styles.txList} role="list" aria-label={t('wallet.history.listLabel')}>
        {transactions.map((tx) => {
          const config = TX_TYPE_CONFIG[tx.type];
          const isIncoming = tx.direction === 'in';
          return (
            <li key={tx.id}>
              <Card className={styles.txCard} padded interactive>
                <div className={styles.txCardContent}>
                  <div className={`${styles.txIconWrapper} ${styles[`txIcon${config.variant}`]}`}>
                    <AssetIcon name={config.icon} size={20} />
                  </div>
                  <div className={styles.txInfo}>
                    <div className={styles.txHeader}>
                      <span className={styles.txType}>
                        {t(`wallet.history.type.${tx.type}`)}
                      </span>
                      <Badge variant={getStatusVariant(tx.status)} size="xs">
                        {t(`wallet.history.status.${tx.status}`)}
                      </Badge>
                    </div>
                    <span className={styles.txHash}>
                      {truncateHash(tx.hash, 6, 4)}
                    </span>
                    <span className={styles.txTime}>
                      {formatDateRelative(tx.timestamp)}
                      {' · '}
                      {tx.chain}
                    </span>
                  </div>
                  <div className={styles.txAmount}>
                    <span className={`${styles.txValue} ${isIncoming ? styles.txIncoming : styles.txOutgoing}`}>
                      {isIncoming ? '+' : '-'}
                      {formatCryptoAmount(tx.amount, tx.decimals)} {tx.symbol}
                    </span>
                    <span className={styles.txFee}>
                      {t('wallet.history.fee', {
                        amount: formatCryptoAmount(tx.fee, tx.decimals),
                        symbol: tx.feeSymbol,
                      })}
                    </span>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <div className={styles.loadMoreWrapper}>
          <Button
            variant="outline"
            onClick={handleLoadMore}
            loading={isLoading}
            disabled={isLoading}
          >
            {t('common.loadMore')}
          </Button>
        </div>
      )}
    </div>
  );
}

