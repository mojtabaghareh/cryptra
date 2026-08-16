import { useState, useCallback, useEffect } from 'react';
import { Card, Button, AssetIcon, Badge, PriceDisplay, Skeleton, Alert } from '@cryptra/ui';
import { useTranslation } from '@cryptra/i18n';
import { useWalletStore } from '@cryptra/wallets';
import { formatCryptoAmount } from '@cryptra/core';
import styles from './Trade.module.css';

interface Token {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
  priceUsd: number;
  balance?: number;
}

interface SwapQuote {
  fromAmount: number;
  toAmount: number;
  exchangeRate: number;
  priceImpact: number;
  minimumReceived: number;
  fee: number;
  route: string[];
}

export default function Swap(): JSX.Element {
  const { t } = useTranslation();
  const { isConnected, address } = useWalletStore();

  const [tokens, setTokens] = useState<Token[]>([]);
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState<string>('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoadingTokens, setIsLoadingTokens] = useState<boolean>(true);
  const [isQuoting, setIsQuoting] = useState<boolean>(false);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [slippage, setSlippage] = useState<number>(0.5);

  useEffect(() => {
    const fetchTokens = async (): Promise<void> => {
      try {
        setIsLoadingTokens(true);
        const res = await fetch('/api/v1/tokens?chainId=1');
        if (!res.ok) throw new Error('Failed');
        const data: Token[] = await res.json();
        setTokens(data);
        if (data.length >= 2) {
          setFromToken(data[0]);
          setToToken(data[1]);
        }
      } catch {
        setError(t('swap.error.tokens'));
      } finally {
        setIsLoadingTokens(false);
      }
    };
    void fetchTokens();
  }, [t]);

  const fetchQuote = useCallback(async (): Promise<void> => {
    if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
      setQuote(null);
      return;
    }
    try {
      setIsQuoting(true);
      setError(null);
      const res = await fetch('/api/v1/swap/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: fromToken.id,
          toToken: toToken.id,
          fromAmount: parseFloat(fromAmount),
          slippage,
          address,
        }),
      });
      if (!res.ok) throw new Error('Quote failed');
      const data: SwapQuote = await res.json();
      setQuote(data);
    } catch (err) {
      setQuote(null);
      setError(err instanceof Error ? err.message : t('swap.error.quote'));
    } finally {
      setIsQuoting(false);
    }
  }, [fromToken, toToken, fromAmount, slippage, address, t]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchQuote();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchQuote]);

  const handleSwap = async (): Promise<void> => {
    if (!quote || !fromToken || !toToken) return;
    try {
      setIsSwapping(true);
      setError(null);
      const res = await fetch('/api/v1/swap/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: fromToken.id,
          toToken: toToken.id,
          fromAmount: parseFloat(fromAmount),
          slippage,
          address,
        }),
      });
      if (!res.ok) throw new Error('Swap failed');
      setFromAmount('');
      setQuote(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('swap.error.execute'));
    } finally {
      setIsSwapping(false);
    }
  };

  const handleSwitchTokens = (): void => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount('');
    setQuote(null);
  };

  const handleMax = (): void => {
    if (fromToken?.balance) {
      setFromAmount(String(fromToken.balance));
    }
  };

  if (isLoadingTokens) {
    return (
      <div className={styles.swapLoading}>
        <Skeleton variant='rect' height={60} />
        <Skeleton variant='rect' height={60} />
        <Skeleton variant='rect' height={120} />
      </div>
    );
  }

  return (
    <div className={styles.swapContainer}>
      {error && (
        <Alert variant='error' className={styles.swapAlert} onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card className={styles.tokenCard} padded>
        <div className={styles.tokenRow}>
          <label className={styles.tokenLabel}>{t('swap.from')}</label>
          <div className={styles.tokenInputRow}>
            <select
              className={styles.tokenSelect}
              value={fromToken?.id ?? ''}
              onChange={(e) => {
                const t = tokens.find((tok) => tok.id === e.target.value) ?? null;
                setFromToken(t);
                setFromAmount('');
                setQuote(null);
              }}
            >
              {tokens.map((tok) => (
                <option key={tok.id} value={tok.id}>{tok.symbol}</option>
              ))}
            </select>
            <input
              type='number'
              className={styles.amountInput}
              placeholder='0.0'
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              disabled={!isConnected}
            />
          </div>
          {fromToken?.balance !== undefined && (
            <div className={styles.balanceRow}>
              <span className={styles.balanceText}>
                {t('swap.balance', {
                  amount: formatCryptoAmount(fromToken.balance, fromToken.decimals),
                  symbol: fromToken.symbol,
                })}
              </span>
              <button className={styles.maxBtn} onClick={handleMax} type='button'>
                {t('swap.max')}
              </button>
            </div>
          )}
        </div>

        <button
          className={styles.switchBtn}
          onClick={handleSwitchTokens}
          type='button'
          aria-label={t('swap.switch')}
        >
          <AssetIcon name='swap' size={20} />
        </button>

        <div className={styles.tokenRow}>
          <label className={styles.tokenLabel}>{t('swap.to')}</label>
          <div className={styles.tokenInputRow}>
            <select
              className={styles.tokenSelect}
              value={toToken?.id ?? ''}
              onChange={(e) => {
                const t = tokens.find((tok) => tok.id === e.target.value) ?? null;
                setToToken(t);
                setQuote(null);
              }}
            >
              {tokens.map((tok) => (
                <option key={tok.id} value={tok.id}>{tok.symbol}</option>
              ))}
            </select>
            <input
              type='text'
              className={styles.amountInput}
              placeholder='0.0'
              value={quote ? formatCryptoAmount(quote.toAmount, toToken?.decimals ?? 18) : ''}
              readOnly
              disabled
            />
          </div>
        </div>
      </Card>

      <Card className={styles.settingsCard} padded>
        <div className={styles.slippageRow}>
          <span className={styles.settingsLabel}>{t('swap.slippage')}</span>
          <div className={styles.slippageOptions}>
            {[0.1, 0.5, 1.0].map((s) => (
              <button
                key={s}
                className={`${styles.slippageBtn} ${slippage === s ? styles.slippageBtnActive : ''}`}
                onClick={() => setSlippage(s)}
                type='button'
              >
                {s}%
              </button>
            ))}
          </div>
        </div>
      </Card>

      {quote && (
        <Card className={styles.quoteCard} padded>
          <div className={styles.quoteRow}>
            <span className={styles.quoteLabel}>{t('swap.rate')}</span>
            <span className={styles.quoteValue}>
              1 {fromToken?.symbol} = {quote.exchangeRate.toFixed(6)} {toToken?.symbol}
            </span>
          </div>
          <div className={styles.quoteRow}>
            <span className={styles.quoteLabel}>{t('swap.priceImpact')}</span>
            <Badge
              variant={quote.priceImpact > 5 ? 'error' : quote.priceImpact > 2 ? 'warning' : 'success'}
              size='xs'
            >
              {quote.priceImpact.toFixed(2)}%
            </Badge>
          </div>
          <div className={styles.quoteRow}>
            <span className={styles.quoteLabel}>{t('swap.minimumReceived')}</span>
            <span className={styles.quoteValue}>
              {formatCryptoAmount(quote.minimumReceived, toToken?.decimals ?? 18)} {toToken?.symbol}
            </span>
          </div>
          <div className={styles.quoteRow}>
            <span className={styles.quoteLabel}>{t('swap.fee')}</span>
            <span className={styles.quoteValue}>{quote.fee.toFixed(4)} {fromToken?.symbol}</span>
          </div>
          <div className={styles.quoteRoute}>
            <span className={styles.quoteLabel}>{t('swap.route')}</span>
            <div className={styles.routePath}>
              {quote.route.map((r, i) => (
                <span key={i} className={styles.routeStep}>
                  {r}
                  {i < quote.route.length - 1 && <AssetIcon name='chevron-right' size={12} />}
                </span>
              ))}
            </div>
          </div>
        </Card>
      )}

      <Button
        variant='primary'
        size='lg'
        fullWidth
        onClick={handleSwap}
        loading={isSwapping}
        disabled={!isConnected || !quote || isQuoting || isSwapping || !fromAmount}
      >
        {!isConnected
          ? t('swap.connectWallet')
          : isQuoting
            ? t('swap.gettingQuote')
            : t('swap.confirm')}
      </Button>
    </div>
  );
}

