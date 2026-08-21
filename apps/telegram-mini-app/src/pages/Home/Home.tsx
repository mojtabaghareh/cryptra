import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, Button, Skeleton, Badge, PriceDisplay, AssetIcon } from '../../lib/ui';
import { useTranslation } from '../../lib/i18n';
import { formatCurrency, formatPercentage } from '../../lib/format';
import { useWalletStore } from '../../store/walletStore';
import styles from './Home.module.css';

interface PortfolioSummary {
  totalBalance: number;
  totalBalanceChange24h: number;
  totalBalanceChangePercentage24h: number;
  assetCount: number;
}

const QUICK_ACTIONS = [
  { id: 'swap', labelKey: 'home.action.swap', icon: 'swap', path: '/trade', variant: 'primary' as const },
  { id: 'send', labelKey: 'home.action.send', icon: 'send', path: '/wallet', variant: 'secondary' as const },
  { id: 'receive', labelKey: 'home.action.receive', icon: 'receive', path: '/wallet', variant: 'outline' as const },
  { id: 'buy', labelKey: 'home.action.buy', icon: 'buy', path: '/markets', variant: 'outline' as const },
];

export function Home(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isConnected = useWalletStore((s) => s.isConnected);
  const address = useWalletStore((s) => s.address);
  const connect = useWalletStore((s) => s.connect);
  const disconnect = useWalletStore((s) => s.disconnect);

  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPortfolio = useCallback(async () => {
    if (!isConnected) {
      setPortfolio(null);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      // Demo numbers until API is wired with auth token
      setPortfolio({
        totalBalance: 0,
        totalBalanceChange24h: 0,
        totalBalanceChangePercentage24h: 0,
        assetCount: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    void fetchPortfolio();
  }, [fetchPortfolio]);

  const isPositiveChange = (portfolio?.totalBalanceChange24h ?? 0) >= 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{t('home.title')}</h1>
          <p className={styles.subtitle}>{t('home.subtitle')}</p>
        </div>
        <Badge variant={isConnected ? 'success' : 'neutral'} size="sm">
          {isConnected ? t('wallet.status.connected') : t('wallet.status.disconnected')}
        </Badge>
      </header>

      <section className={styles.portfolioSection}>
        <Card className={styles.portfolioCard} padded>
          {isLoading ? (
            <div className={styles.skeletonWrapper}>
              <Skeleton width="60%" height={32} />
              <Skeleton width="40%" height={20} />
            </div>
          ) : !isConnected ? (
            <div className={styles.connectPrompt}>
              <AssetIcon name="wallet" size={48} className={styles.connectIcon} />
              <p className={styles.connectText}>{t('home.connectPrompt')}</p>
              <Button variant="primary" size="lg" onClick={() => void connect()} fullWidth>
                {t('wallet.action.connect')}
              </Button>
            </div>
          ) : portfolio ? (
            <div className={styles.portfolioContent}>
              <div className={styles.portfolioHeader}>
                <span className={styles.portfolioLabel}>{t('home.portfolio.totalBalance')}</span>
                <Badge variant={isPositiveChange ? 'success' : 'error'} size="sm">
                  {isPositiveChange ? '+' : ''}
                  {formatPercentage(portfolio.totalBalanceChangePercentage24h)}
                </Badge>
              </div>
              <PriceDisplay value={portfolio.totalBalance} currency="USD" className={styles.balanceAmount} />
              <p className={styles.balanceChange}>
                <span className={isPositiveChange ? styles.positive : styles.negative}>
                  {isPositiveChange ? '+' : ''}
                  {formatCurrency(portfolio.totalBalanceChange24h, 'USD')}
                </span>{' '}
                {t('home.portfolio.last24h')}
              </p>
            </div>
          ) : (
            <div className={styles.errorState}>
              <p>{t('home.portfolio.error')}</p>
              <Button variant="outline" size="sm" onClick={() => void fetchPortfolio()}>
                {t('common.retry')}
              </Button>
            </div>
          )}
        </Card>
      </section>

      {isConnected && address && (
        <section className={styles.walletStatusSection}>
          <Card className={styles.walletCard} padded>
            <div className={styles.walletInfo}>
              <AssetIcon name="wallet" size={24} />
              <div className={styles.walletDetails}>
                <span className={styles.walletLabel}>{t('home.wallet.address')}</span>
                <code className={styles.walletAddress}>
                  {address.slice(0, 6)}...{address.slice(-4)}
                </code>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => disconnect()}>
              {t('wallet.action.disconnect')}
            </Button>
          </Card>
        </section>
      )}

      <section className={styles.actionsSection}>
        <h2 className={styles.sectionTitle}>{t('home.quickActions.title')}</h2>
        <div className={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.id}
              variant={action.variant}
              size="lg"
              className={styles.actionButton}
              onClick={() => navigate({ to: action.path })}
            >
              <AssetIcon name={action.icon} size={20} />
              <span>{t(action.labelKey)}</span>
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
