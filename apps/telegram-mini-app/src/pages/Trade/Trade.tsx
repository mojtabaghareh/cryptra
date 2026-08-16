import { useState, useCallback } from 'react';
import { Tabs, TabList, Tab, TabPanel } from '@cryptra/ui';
import { useTranslation } from '@cryptra/i18n';
import { useWalletStore } from '@cryptra/wallets';
import Swap from './Swap';
import Perpetuals from './Perpetuals';
import styles from './Trade.module.css';

type TradeTab = 'swap' | 'perpetuals';

export default function Trade(): JSX.Element {
  const { t } = useTranslation();
  const { isConnected } = useWalletStore();
  const [activeTab, setActiveTab] = useState<TradeTab>('swap');

  const handleTabChange = useCallback((tabId: string): void => {
    setActiveTab(tabId as TradeTab);
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('trade.title')}</h1>
        <p className={styles.subtitle}>{t('trade.subtitle')}</p>
      </header>

      <Tabs value={activeTab} onChange={handleTabChange} className={styles.tabs}>
        <TabList className={styles.tabList}>
          <Tab value='swap' id='tab-swap'>{t('trade.tabs.swap')}</Tab>
          <Tab value='perpetuals' id='tab-perpetuals'>{t('trade.tabs.perpetuals')}</Tab>
        </TabList>
        <TabPanel value='swap' className={styles.tabPanel}>
          <Swap />
        </TabPanel>
        <TabPanel value='perpetuals' className={styles.tabPanel}>
          <Perpetuals />
        </TabPanel>
      </Tabs>

      {!isConnected && (
        <div className={styles.connectBanner}>
          <p>{t('trade.connectRequired')}</p>
        </div>
      )}
    </div>
  );
}

