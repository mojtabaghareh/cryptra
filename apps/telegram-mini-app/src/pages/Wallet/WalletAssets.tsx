import { useCallback, useEffect, useState } from 'react';
import { Card, Skeleton, PriceDisplay, AssetIcon, Badge, Button, EmptyState } from '@cryptra/ui';
import { useTranslation } from '@cryptra/i18n';
import { useWalletStore } from '@cryptra/wallets';
import { formatCurrency, formatCryptoAmount } from '@cryptra/core';
import styles from './Wallet.module.css';

interface Asset {
  id: string;
  symbol: string;
  name: string;
  chain: string;
  balance: number;
  balanceUsd: number;
  priceUsd: number;
  priceChange24h: number;
  decimals: number;
  logoUrl?: string;
}

export default function WalletAssets(): JSX.Element {
  const { t } = useTranslation();
  const { address, chainId } = useWalletStore();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async (): Promise<void> => {
    if (!address) return;
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `/api/v1/wallet/assets?address=${encodeURIComponent(address)}&chainId=${chainId ?? 1}`
      );
      if (!response.ok) throw new Error('Failed to fetch assets');
      const data: Asset[] = await response.json();
      setAssets(data.sort((a, b) => b.balanceUsd - a.balanceUsd));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('wallet.assets.error'));
    } finally {
      setIsLoading(false);
    }
  }, [address, chainId, t]);

  useEffect(() => {
    void fetchAssets();
  }, [fetchAssets]);

  const totalBalance = assets.reduce((sum, asset) => sum + asset.balanceUsd, 0);

  if (isLoading) {
    return (
      <div className={styles.assetsLoading}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className={styles.assetCard} padded>
            <div className={styles.assetCardContent}>
              <Skeleton variant="circle" size={40} />
              <div className={styles.assetSkeletonInfo}>
                <Skeleton variant="text" width="120px" height={18} />
                <Skeleton variant="text" width="80px" height={14} />
              </div>
              <div className={styles.assetSkeletonPrice}>
                <Skeleton variant="text" width="100px" height={18} />
                <Skeleton variant="text" width="60px" height={14} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="error"
        title={t('wallet.assets.errorTitle')}
        description={error}
        action={
          <Button variant="primary" onClick={fetchAssets}>
            {t('common.retry')}
          </Button>
        }
      />
    );
  }

  if (assets.length === 0) {
    return (
      <EmptyState
        icon="empty-wallet"
        title={t('wallet.assets.emptyTitle')}
        description={t('wallet.assets.emptyDescription')}
      />
    );
  }

  return (
    <div className={styles.assetsContainer}>
      <Card className={styles.totalCard} padded>
        <span className={styles.totalLabel}>{t('wallet.assets.totalBalance')}</span>
        <PriceDisplay value={totalBalance} currency="USD" className={styles.totalAmount} />
      </Card>

      <ul className={styles.assetsList} role="list" aria-label={t('wallet.assets.listLabel')}>
        {assets.map((asset) => {
          const isPositive = asset.priceChange24h >= 0;
          return (
            <li key={asset.id}>
              <Card className={styles.assetCard} padded interactive>
                <div className={styles.assetCardContent}>
                  <div className={styles.assetIconWrapper}>
                    {asset.logoUrl ? (
                      <img
                        src={asset.logoUrl}
                        alt={asset.symbol}
                        className={styles.assetLogo}
                        loading="lazy"
                        width={40}
                        height={40}
                      />
                    ) : (
                      <AssetIcon name="token" size={40} />
                    )}
                  </div>
                  <div className={styles.assetInfo}>
                    <span className={styles.assetSymbol}>{asset.symbol}</span>
                    <span className={styles.assetName}>{asset.name}</span>
                    <Badge variant="neutral" size="xs" className={styles.assetChain}>
                      {asset.chain}
                    </Badge>
                  </div>
                  <div className={styles.assetPrice}>
                    <PriceDisplay
                      value={asset.balanceUsd}
                      currency="USD"
                      className={styles.assetBalanceUsd}
                    />
                    <span className={styles.assetBalance}>
                      {formatCryptoAmount(asset.balance, asset.decimals)} {asset.symbol}
                    </span>
                    <Badge
                      variant={isPositive ? 'success' : 'error'}
                      size="xs"
                      className={styles.assetChange}
                    >
                      {isPositive ? '+' : ''}
                      {asset.priceChange24h.toFixed(2)}%
                    </Badge>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

