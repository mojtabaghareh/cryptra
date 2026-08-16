import { useState, useCallback } from 'react';
import { Card, Button, Alert, AssetIcon, Spinner } from '@cryptra/ui';
import { useTranslation } from '@cryptra/i18n';
import { useWalletStore } from '@cryptra/wallets';
import styles from './Wallet.module.css';

interface WalletProvider {
  id: string;
  nameKey: string;
  icon: string;
  type: 'injected' | 'walletConnect' | 'telegram';
}

const WALLET_PROVIDERS: WalletProvider[] = [
  { id: 'telegram', nameKey: 'wallet.provider.telegram', icon: 'telegram', type: 'telegram' },
  { id: 'metamask', nameKey: 'wallet.provider.metamask', icon: 'metamask', type: 'injected' },
  { id: 'walletconnect', nameKey: 'wallet.provider.walletconnect', icon: 'walletconnect', type: 'walletConnect' },
  { id: 'phantom', nameKey: 'wallet.provider.phantom', icon: 'phantom', type: 'injected' },
];

export default function ConnectWallet(): JSX.Element {
  const { t } = useTranslation();
  const { connect, error: walletError, clearError } = useWalletStore();
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleConnect = useCallback(async (provider: WalletProvider): Promise<void> => {
    try {
      setConnectingId(provider.id);
      setLocalError(null);
      clearError();
      await connect({ provider: provider.type, chainId: 1 });
    } catch (err) {
      const message = err instanceof Error ? err.message : t('wallet.error.unknown');
      setLocalError(message);
    } finally {
      setConnectingId(null);
    }
  }, [connect, clearError, t]);

  const error = walletError ?? localError;

  return (
    <div className={styles.connectContainer}>
      <header className={styles.connectHeader}>
        <AssetIcon name="wallet" size={56} className={styles.connectMainIcon} />
        <h1 className={styles.connectTitle}>{t('wallet.connect.title')}</h1>
        <p className={styles.connectDescription}>{t('wallet.connect.description')}</p>
      </header>

      {error && (
        <Alert
          variant="error"
          className={styles.connectAlert}
          onDismiss={() => { setLocalError(null); clearError(); }}
        >
          {error}
        </Alert>
      )}

      <section className={styles.providersSection} aria-label={t('wallet.providers.label')}>
        <h2 className={styles.providersTitle}>{t('wallet.providers.title')}</h2>
        <div className={styles.providersList}>
          {WALLET_PROVIDERS.map((provider) => (
            <Card
              key={provider.id}
              className={styles.providerCard}
              padded
              interactive
              onClick={() => { void handleConnect(provider); }}
              disabled={connectingId !== null}
            >
              <div className={styles.providerContent}>
                <AssetIcon
                  name={provider.icon}
                  size={40}
                  className={styles.providerIcon}
                />
                <div className={styles.providerInfo}>
                  <span className={styles.providerName}>{t(provider.nameKey)}</span>
                  <span className={styles.providerType}>
                    {t(`wallet.provider.type.${provider.type}`)}
                  </span>
                </div>
                {connectingId === provider.id ? (
                  <Spinner size="sm" />
                ) : (
                  <AssetIcon name="chevron-right" size={20} className={styles.providerArrow} />
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <footer className={styles.connectFooter}>
        <p className={styles.securityNote}>
          <AssetIcon name="shield" size={16} />
          {t('wallet.connect.securityNote')}
        </p>
      </footer>
    </div>
  );
}

