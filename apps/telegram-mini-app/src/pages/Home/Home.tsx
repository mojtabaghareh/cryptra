import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Skeleton, Badge, PriceDisplay, AssetIcon } from '@cryptra/ui';
import { useTranslation } from '@cryptra/i18n';
import { useWalletStore } from '@cryptra/wallets';
import { formatCurrency, formatPercentage } from '@cryptra/core';
import styles from './Home.module.css';

interface PortfolioSummary {
  totalBalance: number;
  totalBalanceChange24h: number;
  totalBalanceChangePercentage24h: number;
  assetCount: number;
}

interface QuickAction {
  id: string;
  labelKey: string;
  icon: string;
  path: string;
  variant: 'primary' | 'secondary' | 'outline';
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'swap', labelKey: 'home.action.swap', icon: 'swap', path: '/swap', variant: 'primary' },
  { id: 'send', labelKey: 'home.action.send', icon: 'send', path: '/send', variant: 'secondary' },
  { id: 'receive', labelKey: 'home.action.receive', icon: 'receive', path: '/receive', variant: 'outline' },
  { id: 'buy', labelKey: 'home.action.buy', icon: 'buy', path: '/buy', variant: 'outline' },
];

export default function Home(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isConnected, address, connect, disconnect } = useWalletStore();
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchPortfolio = useCallback(async (): Promise<void> => {
    if (!isConnected) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch(`/api/v1/portfolio/summary?address=${encodeURIComponent(address ?? '')}`);
      if (!response.ok) throw new Error('Failed to fetch portfolio');
      const data: PortfolioSummary = await response.json();
      setPortfolio(data);
    } catch (error) {
      console.error('Portfolio fetch error:', error);
      setPortfolio(null);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address]);

  useEffect(() => {
    void fetchPortfolio();
  }, [fetchPortfolio]);

  const handleConnect = async (): Promise<void> => {
    try {
      await connect();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleQuickAction = (path: string): void => {
    navigate(path);
  };

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

      <section className={styles.portfolioSection} aria-label={t('home.portfolio.label')}>
        <Card className={styles.portfolioCard} padded>
          {isLoading ? (
            <div className={styles.skeletonWrapper}>
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="text" width="40%" height={20} />
              <Skeleton variant="text" width="80%" height={48} />
            </div>
          ) : !isConnected ? (
            <div className={styles.connectPrompt}>
              <AssetIcon name="wallet" size={48} className={styles.connectIcon} />
              <p className={styles.connectText}>{t('home.connectPrompt')}</p>
              <Button variant="primary" size="lg" onClick={handleConnect} fullWidth>
                {t('wallet.action.connect')}
              </Button>
            </div>
          ) : portfolio ? (
            <div className={styles.portfolioContent}>
              <div className={styles.portfolioHeader}>
                <span className={styles.portfolioLabel}>{t('home.portfolio.totalBalance')}</span>
                <Badge
                  variant={isPositiveChange ? 'success' : 'error'}
                  size="sm"
                  className={styles.changeBadge}
                >
                  {isPositiveChange ? '+' : ''}
                  {formatPercentage(portfolio.totalBalanceChangePercentage24h)}
                </Badge>
              </div>
              <PriceDisplay
                value={portfolio.totalBalance}
                currency="USD"
                className={styles.balanceAmount}
              />
              <p className={styles.balanceChange}>
                <span className={isPositiveChange ? styles.positive : styles.negative}>
                  {isPositiveChange ? '+' : ''}
                  {formatCurrency(portfolio.totalBalanceChange24h, 'USD')}
                </span>
                {' '}{t('home.portfolio.last24h')}
              </p>
              {portfolio.assetCount > 0 && (
                <p className={styles.assetCount}>
                  {t('home.portfolio.assetCount', { count: portfolio.assetCount })}
                </p>
              )}
            </div>
          ) : (
            <div className={styles.errorState}>
              <p>{t('home.portfolio.error')}</p>
              <Button variant="outline" size="sm" onClick={fetchPortfolio}>
                {t('common.retry')}
              </Button>
            </div>
          )}
        </Card>
      </section>

      {isConnected && (
        <section className={styles.walletStatusSection} aria-label={t('home.wallet.label')}>
          <Card className={styles.walletCard} padded>
            <div className={styles.walletInfo}>
              <AssetIcon name="wallet" size={24} />
              <div className={styles.walletDetails}>
                <span className={styles.walletLabel}>{t('home.wallet.address')}</span>
                <code className={styles.walletAddress}>
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                </code>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={disconnect}>
              {t('wallet.action.disconnect')}
            </Button>
          </Card>
        </section>
      )}

      <section className={styles.actionsSection} aria-label={t('home.quickActions.label')}>
        <h2 className={styles.sectionTitle}>{t('home.quickActions.title')}</h2>
        <div className={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.id}
              variant={action.variant}
              size="lg"
              className={styles.actionButton}
              onClick={() => handleQuickAction(action.path)}
              disabled={!isConnected && action.id !== 'buy'}
            >
              <AssetIcon name={action.icon} size={20} />
              <span>{t(action.labelKey)}</span>
            </Button>
          ))}
        </div>
      </section>

      {isConnected && portfolio && (
        <section className={styles.marketSection} aria-label={t('home.market.label')}>
          <h2 className={styles.sectionTitle}>{t('home.market.title')}</h2>
          <Card className={styles.marketCard} padded>
            <div className={styles.marketPlaceholder}>
              <AssetIcon name="chart" size={32} />
              <p>{t('home.market.comingSoon')}</p>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}

