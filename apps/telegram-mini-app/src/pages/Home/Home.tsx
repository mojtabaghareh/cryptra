import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, Button, Skeleton, Badge, PriceDisplay, AssetIcon } from '../../lib/ui';
import { useTranslation } from '../../lib/i18n';
import { useWalletStore } from '../../store/walletStore';
import { useSessionStore } from '../../store/sessionStore';
import { apiGet } from '../../lib/api';
import styles from './Home.module.css';

interface PortfolioData {
  totalValueUsd: number;
  openPositions: number;
  recentSwaps: number;
  assets: Array<{ symbol: string; chain?: string; balance: string }>;
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
  const token = useSessionStore((s) => s.token);
  const sessionUser = useSessionStore((s) => s.user);

  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPortfolio = useCallback(async () => {
    setIsLoading(true);
    try {
      if (token) {
        const res = await apiGet<{ success: boolean; data: PortfolioData }>(
          '/api/v1/portfolio/me',
          token,
        );
        if (res.success) setPortfolio(res.data);
        else setPortfolio(null);
      } else {
        setPortfolio(null);
      }
    } catch {
      setPortfolio(null);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchPortfolio();
  }, [fetchPortfolio]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{t('home.title')}</h1>
          <p className={styles.subtitle}>{t('home.subtitle')}</p>
        </div>
        <Badge variant={token ? 'success' : isConnected ? 'success' : 'neutral'} size="sm">
          {token ? 'Session' : isConnected ? t('wallet.status.connected') : t('wallet.status.disconnected')}
        </Badge>
      </header>

      {sessionUser && (
        <section style={{ marginBottom: 12 }}>
          <Card padded>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>
                {sessionUser.firstName || sessionUser.username || 'Trader'}
              </span>
              <Badge variant="success">L{sessionUser.level}</Badge>
              <Badge variant="neutral">{sessionUser.xp} XP</Badge>
            </div>
          </Card>
        </section>
      )}

      <section className={styles.portfolioSection}>
        <Card className={styles.portfolioCard} padded>
          {isLoading ? (
            <div className={styles.skeletonWrapper}>
              <Skeleton width="60%" height={32} />
              <Skeleton width="40%" height={20} />
            </div>
          ) : portfolio ? (
            <div className={styles.portfolioContent}>
              <div className={styles.portfolioHeader}>
                <span className={styles.portfolioLabel}>{t('home.portfolio.totalBalance')}</span>
              </div>
              <PriceDisplay value={portfolio.totalValueUsd} currency="USD" className={styles.balanceAmount} />
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>
                {portfolio.openPositions} open positions · {portfolio.recentSwaps} swaps (7d)
              </p>
              {portfolio.assets.length > 0 && (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                  {portfolio.assets.length} linked wallet(s)
                </p>
              )}
            </div>
          ) : !token && !isConnected ? (
            <div className={styles.connectPrompt}>
              <AssetIcon name="wallet" size={48} className={styles.connectIcon} />
              <p className={styles.connectText}>{t('home.connectPrompt')}</p>
              <Button variant="primary" size="lg" onClick={() => void connect()} fullWidth>
                {t('wallet.action.connect')}
              </Button>
              <p style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                Or open from Telegram for full session portfolio
              </p>
            </div>
          ) : (
            <div className={styles.errorState}>
              <p>{token ? t('home.portfolio.error') : 'Connect wallet or open in Telegram'}</p>
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

      <section style={{ marginTop: 16, display: 'grid', gap: 8 }}>
        <Button fullWidth variant="outline" onClick={() => navigate({ to: '/reflection' })}>
          Weekly Reflection
        </Button>
        <Button fullWidth variant="ghost" onClick={() => navigate({ to: '/status' })}>
          System status
        </Button>
      </section>
    </div>
  );
}

export default Home;
