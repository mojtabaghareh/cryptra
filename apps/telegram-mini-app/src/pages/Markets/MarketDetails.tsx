import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Skeleton, Badge, PriceDisplay, AssetIcon, Button } from '@cryptra/ui';
import { useTranslation } from '@cryptra/i18n';
import { formatPercentage } from '@cryptra/core';
import styles from './Markets.module.css';

interface MarketDetail {
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
  circulatingSupply: number;
  totalSupply: number;
  logoUrl?: string;
  chain: string;
  description: string;
  website?: string;
}

interface PricePoint {
  timestamp: string;
  price: number;
}

export default function MarketDetails(): JSX.Element {
  const { t } = useTranslation();
  const { marketId } = useParams<{ marketId: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<MarketDetail | null>(null);
  const [chartData, setChartData] = useState<PricePoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  const fetchDetail = useCallback(async (): Promise<void> => {
    if (!marketId) return;
    try {
      setIsLoading(true);
      setError(null);
      const [detailRes, chartRes] = await Promise.all([
        fetch(`/api/v1/markets/${marketId}`),
        fetch(`/api/v1/markets/${marketId}/chart?timeframe=${timeframe}`),
      ]);
      if (!detailRes.ok) throw new Error('Failed to fetch market detail');
      if (!chartRes.ok) throw new Error('Failed to fetch chart');
      const detailData: MarketDetail = await detailRes.json();
      const chartDataRaw: PricePoint[] = await chartRes.json();
      setDetail(detailData);
      setChartData(chartDataRaw);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('markets.detail.error'));
    } finally {
      setIsLoading(false);
    }
  }, [marketId, timeframe, t]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.detailHeaderSkeleton}>
          <Skeleton variant='circle' size={48} />
          <div className={styles.detailTitleSkeleton}>
            <Skeleton variant='text' width='140px' height={24} />
            <Skeleton variant='text' width='100px' height={16} />
          </div>
        </div>
        <Skeleton variant='rect' width='100%' height={200} />
        <div className={styles.detailGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant='rect' height={80} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className={styles.container}>
        <div className={styles.errorWrapper}>
          <AssetIcon name='error' size={48} />
          <p className={styles.errorText}>{error ?? t('markets.detail.notFound')}</p>
          <Button variant='primary' onClick={() => navigate('/markets')}>
            {t('markets.backToList')}
          </Button>
        </div>
      </div>
    );
  }

  const isPositive = detail.priceChange24h >= 0;
  const priceRange = detail.high24h - detail.low24h;
  const pricePosition = priceRange > 0 ? ((detail.price - detail.low24h) / priceRange) * 100 : 50;

  return (
    <div className={styles.container}>
      <header className={styles.detailHeader}>
        <button
          className={styles.backBtn}
          onClick={() => navigate('/markets')}
          type='button'
          aria-label={t('common.back')}
        >
          <AssetIcon name='chevron-right' size={20} />
        </button>
        <div className={styles.detailIconWrapper}>
          {detail.logoUrl ? (
            <img
              src={detail.logoUrl}
              alt={detail.symbol}
              className={styles.detailLogo}
              loading='lazy'
              width={48}
              height={48}
            />
          ) : (
            <AssetIcon name='token' size={48} />
          )}
        </div>
        <div className={styles.detailTitleGroup}>
          <h1 className={styles.detailSymbol}>{detail.symbol}</h1>
          <p className={styles.detailName}>{detail.name}</p>
          <Badge variant='neutral' size='xs'>{detail.chain}</Badge>
        </div>
      </header>

      <section className={styles.priceSection} aria-label={t('markets.detail.price')}>
        <div className={styles.priceMain}>
          <PriceDisplay value={detail.price} currency='USD' className={styles.detailPrice} />
          <Badge variant={isPositive ? 'success' : 'error'} size='md'>
            {isPositive ? '+' : ''}{formatPercentage(detail.priceChangePercentage24h)}
          </Badge>
        </div>
        <p className={styles.priceChange}>
          {isPositive ? '+' : ''}{detail.priceChange24h.toFixed(4)} USD {t('markets.detail.last24h')}
        </p>
      </section>

      <section className={styles.chartSection} aria-label={t('markets.detail.chart')}>
        <div className={styles.timeframeSelector}>
          {(['1h', '24h', '7d', '30d'] as const).map((tf) => (
            <button
              key={tf}
              className={`${styles.timeframeBtn} ${timeframe === tf ? styles.timeframeBtnActive : ''}`}
              onClick={() => setTimeframe(tf)}
              type='button'
            >
              {t(`markets.timeframe.${tf}`)}
            </button>
          ))}
        </div>
        <div className={styles.chartPlaceholder}>
          {chartData.length > 0 ? (
            <div className={styles.miniChart}>
              {chartData.map((pt, idx) => {
                const min = Math.min(...chartData.map((d) => d.price));
                const max = Math.max(...chartData.map((d) => d.price));
                const range = max - min || 1;
                const h = ((pt.price - min) / range) * 100;
                return (
                  <div
                    key={idx}
                    className={styles.chartBar}
                    style={{ height: `${Math.max(4, h)}%`, opacity: idx / chartData.length + 0.3 }}
                    title={`${pt.price}`}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon='chart'
              title={t('markets.chart.noData')}
              description={t('markets.chart.tryLater')}
            />
          )}
        </div>
      </section>

      <section className={styles.statsSection} aria-label={t('markets.detail.stats')}>
        <h2 className={styles.sectionTitle}>{t('markets.detail.statsTitle')}</h2>
        <div className={styles.detailGrid}>
          <Card className={styles.statCard} padded>
            <span className={styles.statLabel}>{t('markets.detail.marketCap')}</span>
            <PriceDisplay value={detail.marketCap} currency='USD' compact className={styles.statValue} />
          </Card>
          <Card className={styles.statCard} padded>
            <span className={styles.statLabel}>{t('markets.detail.volume24h')}</span>
            <PriceDisplay value={detail.volume24h} currency='USD' compact className={styles.statValue} />
          </Card>
          <Card className={styles.statCard} padded>
            <span className={styles.statLabel}>{t('markets.detail.high24h')}</span>
            <PriceDisplay value={detail.high24h} currency='USD' className={styles.statValue} />
          </Card>
          <Card className={styles.statCard} padded>
            <span className={styles.statLabel}>{t('markets.detail.low24h')}</span>
            <PriceDisplay value={detail.low24h} currency='USD' className={styles.statValue} />
          </Card>
          <Card className={styles.statCard} padded>
            <span className={styles.statLabel}>{t('markets.detail.circulatingSupply')}</span>
            <span className={styles.statValue}>
              {new Intl.NumberFormat('en', { notation: 'compact' }).format(detail.circulatingSupply)} {detail.symbol}
            </span>
          </Card>
          <Card className={styles.statCard} padded>
            <span className={styles.statLabel}>{t('markets.detail.totalSupply')}</span>
            <span className={styles.statValue}>
              {new Intl.NumberFormat('en', { notation: 'compact' }).format(detail.totalSupply)} {detail.symbol}
            </span>
          </Card>
        </div>
      </section>

      <section className={styles.rangeSection}>
        <div className={styles.rangeBar}>
          <div className={styles.rangeTrack} />
          <div className={styles.rangeFill} style={{ width: `${pricePosition}%` }} />
          <div className={styles.rangeThumb} style={{ left: `${pricePosition}%` }} />
        </div>
        <div className={styles.rangeLabels}>
          <span className={styles.rangeLow}>Low: <PriceDisplay value={detail.low24h} currency='USD' /></span>
          <span className={styles.rangeHigh}>High: <PriceDisplay value={detail.high24h} currency='USD' /></span>
        </div>
      </section>

      {detail.description && (
        <section className={styles.aboutSection}>
          <h2 className={styles.sectionTitle}>{t('markets.detail.about')}</h2>
          <p className={styles.aboutText}>{detail.description}</p>
          {detail.website && (
            <a
              href={detail.website}
              target='_blank'
              rel='noopener noreferrer'
              className={styles.websiteLink}
            >
              {t('markets.detail.visitWebsite')}
            </a>
          )}
        </section>
      )}
    </div>
  );
}

