import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Skeleton, Badge, PriceDisplay, AssetIcon, Button, EmptyState } from '@cryptra/ui';
import { useTranslation } from '@cryptra/i18n';
import { formatPercentage } from '@cryptra/core';
import styles from './Markets.module.css';

interface Market {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  volume24h: number;
  marketCap: number;
  high24h: number;
  low24h: number;
  logoUrl?: string;
  chain: string;
}

export default function Markets(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'gainers' | 'losers' | 'volume'>('all');

  const fetchMarkets = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/v1/markets?limit=100');
      if (!response.ok) throw new Error('Failed to fetch markets');
      const data: Market[] = await response.json();
      setMarkets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('markets.error'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchMarkets();
  }, [fetchMarkets]);

  const filteredMarkets = markets.filter((m) => {
    switch (filter) {
      case 'gainers':
        return m.priceChange24h > 0;
      case 'losers':
        return m.priceChange24h < 0;
      case 'volume':
        return m.volume24h > 0;
      default:
        return true;
    }
  });

  const handleMarketClick = (marketId: string): void => {
    navigate(`/markets/${marketId}`);
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>{t('markets.title')}</h1>
          <p className={styles.subtitle}>{t('markets.subtitle')}</p>
        </header>
        <div className={styles.filterSkeleton}>
          <Skeleton variant='rect' width='100%' height={40} />
        </div>
        <div className={styles.listLoading}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className={styles.marketCard} padded>
              <div className={styles.marketCardContent}>
                <Skeleton variant='circle' size={40} />
                <div className={styles.marketSkeletonInfo}>
                  <Skeleton variant='text' width='100px' height={18} />
                  <Skeleton variant='text' width='60px' height={14} />
                </div>
                <div className={styles.marketSkeletonPrice}>
                  <Skeleton variant='text' width='90px' height={18} />
                  <Skeleton variant='text' width='50px' height={14} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <EmptyState
          icon='error'
          title={t('markets.errorTitle')}
          description={error}
          action={
            <Button variant='primary' onClick={fetchMarkets}>{t('common.retry')}</Button>
          }
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('markets.title')}</h1>
        <p className={styles.subtitle}>{t('markets.subtitle')}</p>
      </header>

      <div className={styles.filters} role='tablist' aria-label={t('markets.filters.label')}>
        {(['all', 'gainers', 'losers', 'volume'] as const).map((f) => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter(f)}
            role='tab'
            aria-selected={filter === f}
            type='button'
          >
            {t(`markets.filter.${f}`)}
          </button>
        ))}
      </div>

      <ul className={styles.marketList} role='list' aria-label={t('markets.listLabel')}>
        {filteredMarkets.map((market) => {
          const isPositive = market.priceChange24h >= 0;
          return (
            <li key={market.id}>
              <Card
                className={styles.marketCard}
                padded
                interactive
                onClick={() => handleMarketClick(market.id)}
              >
                <div className={styles.marketCardContent}>
                  <div className={styles.marketIconWrapper}>
                    {market.logoUrl ? (
                      <img
                        src={market.logoUrl}
                        alt={market.symbol}
                        className={styles.marketLogo}
                        loading='lazy'
                        width={40}
                        height={40}
                      />
                    ) : (
                      <AssetIcon name='token' size={40} />
                    )}
                  </div>
                  <div className={styles.marketInfo}>
                    <span className={styles.marketSymbol}>{market.symbol}</span>
                    <span className={styles.marketName}>{market.name}</span>
                    <Badge variant='neutral' size='xs'>{market.chain}</Badge>
                  </div>
                  <div className={styles.marketPrice}>
                    <PriceDisplay
                      value={market.price}
                      currency='USD'
                      className={styles.marketPriceValue}
                    />
                    <Badge
                      variant={isPositive ? 'success' : 'error'}
                      size='xs'
                      className={styles.marketChange}
                    >
                      {isPositive ? '+' : ''}{formatPercentage(market.priceChangePercentage24h)}
                    </Badge>
                    <span className={styles.marketVolume}>
                      {t('markets.volume24h', {
                        vol: new Intl.NumberFormat('en', { notation: 'compact' }).format(market.volume24h),
                      })}
                    </span>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      {filteredMarkets.length === 0 && (
        <EmptyState
          icon='empty-list'
          title={t('markets.emptyTitle')}
          description={t('markets.emptyDescription')}
        />
      )}
    </div>
  );
}

