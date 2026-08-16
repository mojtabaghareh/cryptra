import { useState, useCallback, useEffect } from 'react';
import { Card, Button, Badge, PriceDisplay, Skeleton, Alert } from '@cryptra/ui';
import { useTranslation } from '@cryptra/i18n';
import { useWalletStore } from '@cryptra/wallets';
import { formatCryptoAmount } from '@cryptra/core';
import styles from './Trade.module.css';

type PositionSide = 'long' | 'short';

interface PerpMarket {
  id: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  markPrice: number;
  indexPrice: number;
  fundingRate: number;
  openInterest: number;
  volume24h: number;
  leverageMax: number;
  maintenanceMargin: number;
}

interface PerpQuote {
  margin: number;
  size: number;
  notional: number;
  liquidationPrice: number;
  entryPrice: number;
  fee: number;
}

export default function Perpetuals(): JSX.Element {
  const { t } = useTranslation();
  const { isConnected } = useWalletStore();

  const [markets, setMarkets] = useState<PerpMarket[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<PerpMarket | null>(null);
  const [side, setSide] = useState<PositionSide>('long');
  const [leverage, setLeverage] = useState<number>(5);
  const [margin, setMargin] = useState<string>('');
  const [quote, setQuote] = useState<PerpQuote | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [positions, setPositions] = useState<
    Array<{
      id: string;
      side: PositionSide;
      size: number;
      entryPrice: number;
      leverage: number;
      pnl: number;
      liquidationPrice: number;
    }>
  >([]);

  useEffect(() => {
    const fetchMarkets = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/v1/perpetuals/markets');
        if (!res.ok) throw new Error('Failed');
        const data: PerpMarket[] = await res.json();
        setMarkets(data);
        if (data.length > 0) setSelectedMarket(data[0]);
      } catch {
        setError(t('perpetuals.error.markets'));
      } finally {
        setIsLoading(false);
      }
    };
    void fetchMarkets();
  }, [t]);

  useEffect(() => {
    if (!selectedMarket || !margin || parseFloat(margin) <= 0) {
      setQuote(null);
      return;
    }
    const m = parseFloat(margin);
    const notional = m * leverage;
    const size = notional / selectedMarket.markPrice;
    const fee = notional * 0.0006;
    const liqPrice =
      side === 'long'
        ? selectedMarket.markPrice * (1 - 0.9 / leverage)
        : selectedMarket.markPrice * (1 + 0.9 / leverage);
    setQuote({ margin: m, size, notional, liquidationPrice: liqPrice, entryPrice: selectedMarket.markPrice, fee });
  }, [selectedMarket, margin, leverage, side]);

  const handleOpenPosition = async (): Promise<void> => {
    if (!quote || !selectedMarket) return;
    try {
      setIsSubmitting(true);
      setError(null);
      const res = await fetch('/api/v1/perpetuals/position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId: selectedMarket.id,
          side,
          leverage,
          margin: parseFloat(margin),
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const pos = await res.json();
      setPositions((prev) => [...prev, pos]);
      setMargin('');
      setQuote(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('perpetuals.error.open'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.perpLoading}>
        <Skeleton variant='rect' height={50} />
        <Skeleton variant='rect' height={200} />
        <Skeleton variant='rect' height={120} />
      </div>
    );
  }

  return (
    <div className={styles.perpContainer}>
      {error && (
        <Alert variant='error' className={styles.perpAlert} onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card className={styles.marketSelectorCard} padded>
        <label className={styles.inputLabel}>{t('perpetuals.market')}</label>
        <select
          className={styles.marketSelect}
          value={selectedMarket?.id ?? ''}
          onChange={(e) => {
            const m = markets.find((mk) => mk.id === e.target.value) ?? null;
            setSelectedMarket(m);
            setQuote(null);
          }}
        >
          {markets.map((m) => (
            <option key={m.id} value={m.id}>{m.symbol}</option>
          ))}
        </select>
        {selectedMarket && (
          <div className={styles.marketInfoRow}>
            <span className={styles.marketInfoLabel}>{t('perpetuals.markPrice')}</span>
            <PriceDisplay
              value={selectedMarket.markPrice}
              currency='USD'
              className={styles.marketInfoValue}
            />
            <Badge
              variant={selectedMarket.fundingRate >= 0 ? 'success' : 'error'}
              size='xs'
            >
              {selectedMarket.fundingRate >= 0 ? '+' : ''}{(selectedMarket.fundingRate * 100).toFixed(4)}%
            </Badge>
          </div>
        )}
      </Card>

      <div className={styles.sideSelector}>
        <button
          className={`${styles.sideBtn} ${styles.sideBtnLong} ${side === 'long' ? styles.sideBtnActiveLong : ''}`}
          onClick={() => setSide('long')}
          type='button'
        >
          {t('perpetuals.long')}
        </button>
        <button
          className={`${styles.sideBtn} ${styles.sideBtnShort} ${side === 'short' ? styles.sideBtnActiveShort : ''}`}
          onClick={() => setSide('short')}
          type='button'
        >
          {t('perpetuals.short')}
        </button>
      </div>

      <Card className={styles.orderCard} padded>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>{t('perpetuals.margin')}</label>
          <input
            type='number'
            className={styles.amountInput}
            placeholder='0.0'
            value={margin}
            onChange={(e) => setMargin(e.target.value)}
            disabled={!isConnected}
          />
        </div>
        <div className={styles.leverageGroup}>
          <label className={styles.inputLabel}>
            {t('perpetuals.leverage', { value: leverage })}
          </label>
          <input
            type='range'
            className={styles.leverageSlider}
            min={1}
            max={selectedMarket?.leverageMax ?? 20}
            step={1}
            value={leverage}
            onChange={(e) => setLeverage(parseInt(e.target.value, 10))}
            disabled={!isConnected}
          />
          <div className={styles.leverageLabels}>
            <span>1x</span>
            <span>{selectedMarket?.leverageMax ?? 20}x</span>
          </div>
        </div>
      </Card>

      {quote && selectedMarket && (
        <Card className={styles.quoteCard} padded>
          <div className={styles.quoteRow}>
            <span className={styles.quoteLabel}>{t('perpetuals.positionSize')}</span>
            <span className={styles.quoteValue}>
              {formatCryptoAmount(quote.size, 4)} {selectedMarket.baseAsset}
            </span>
          </div>
          <div className={styles.quoteRow}>
            <span className={styles.quoteLabel}>{t('perpetuals.notional')}</span>
            <PriceDisplay value={quote.notional} currency='USD' className={styles.quoteValue} />
          </div>
          <div className={styles.quoteRow}>
            <span className={styles.quoteLabel}>{t('perpetuals.entryPrice')}</span>
            <PriceDisplay value={quote.entryPrice} currency='USD' className={styles.quoteValue} />
          </div>
          <div className={styles.quoteRow}>
            <span className={styles.quoteLabel}>{t('perpetuals.liquidationPrice')}</span>
            <span className={`${styles.quoteValue} ${side === 'long' ? styles.liqLong : styles.liqShort}`}>
              <PriceDisplay value={quote.liquidationPrice} currency='USD' />
            </span>
          </div>
          <div className={styles.quoteRow}>
            <span className={styles.quoteLabel}>{t('perpetuals.fee')}</span>
            <span className={styles.quoteValue}>{quote.fee.toFixed(4)} {selectedMarket.quoteAsset}</span>
          </div>
        </Card>
      )}

      <Button
        variant={side === 'long' ? 'success' : 'error'}
        size='lg'
        fullWidth
        onClick={handleOpenPosition}
        loading={isSubmitting}
        disabled={!isConnected || !quote || isSubmitting || !margin}
      >
        {!isConnected ? t('perpetuals.connectWallet') : t('perpetuals.openPosition')}
      </Button>

      {positions.length > 0 && (
        <section className={styles.positionsSection} aria-label={t('perpetuals.positions')}>
          <h3 className={styles.sectionTitle}>{t('perpetuals.openPositions')}</h3>
          <ul className={styles.positionList}>
            {positions.map((pos) => (
              <li key={pos.id}>
                <Card className={styles.positionCard} padded>
                  <div className={styles.positionHeader}>
                    <Badge variant={pos.side === 'long' ? 'success' : 'error'} size='sm'>
                      {pos.side.toUpperCase()}
                    </Badge>
                    <span className={styles.positionLeverage}>{pos.leverage}x</span>
                  </div>
                  <div className={styles.positionRow}>
                    <span className={styles.positionLabel}>{t('perpetuals.posSize')}</span>
                    <span className={styles.positionValue}>{formatCryptoAmount(pos.size, 4)}</span>
                  </div>
                  <div className={styles.positionRow}>
                    <span className={styles.positionLabel}>{t('perpetuals.posEntry')}</span>
                    <PriceDisplay value={pos.entryPrice} currency='USD' className={styles.positionValue} />
                  </div>
                  <div className={styles.positionRow}>
                    <span className={styles.positionLabel}>{t('perpetuals.posPnl')}</span>
                    <span
                      className={`${styles.positionValue} ${pos.pnl >= 0 ? styles.pnlPositive : styles.pnlNegative}`}
                    >
                      {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)} USD
                    </span>
                  </div>
                  <div className={styles.positionRow}>
                    <span className={styles.positionLabel}>{t('perpetuals.posLiq')}</span>
                    <PriceDisplay value={pos.liquidationPrice} currency='USD' className={styles.positionValue} />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

