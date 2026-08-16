import { useState, useCallback } from 'react';
import { Tabs, TabList, Tab, TabPanel } from '@cryptra/ui';
import { useTranslation } from '@cryptra/i18n';
import { useWalletStore } from '@cryptra/wallets';
import ConnectWallet from './ConnectWallet';
import WalletAssets from './WalletAssets';
import WalletHistory from './WalletHistory';
import styles from './Wallet.module.css';

type WalletTab = 'assets' | 'history';

export default function Wallet(): JSX.Element {
  const { t } = useTranslation();
  const { isConnected } = useWalletStore();
  const [activeTab, setActiveTab] = useState<WalletTab>('assets');

  const handleTabChange = useCallback((tabId: string): void => {
    setActiveTab(tabId as WalletTab);
  }, []);

  if (!isConnected) {
    return <ConnectWallet />;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('wallet.title')}</h1>
        <p className={styles.subtitle}>{t('wallet.subtitle')}</p>
      </header>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        className={styles.tabs}
      >
        <TabList className={styles.tabList}>
          <Tab value="assets" id="tab-assets">
            {t('wallet.tabs.assets')}
          </Tab>
          <Tab value="history" id="tab-history">
            {t('wallet.tabs.history')}
          </Tab>
        </TabList>

        <TabPanel value="assets" className={styles.tabPanel}>
          <WalletAssets />
        </TabPanel>

        <TabPanel value="history" className={styles.tabPanel}>
          <WalletHistory />
        </TabPanel>
      </Tabs>
    </div>
  );
}

