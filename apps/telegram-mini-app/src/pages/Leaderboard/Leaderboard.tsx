import { useState, useCallback } from 'react';
import { Tabs, TabList, Tab, TabPanel } from '@cryptra/ui';
import { useTranslation } from '@cryptra/i18n';
import XPLeaderboard from './XPLeaderboard';
import TradingLeaderboard from './TradingLeaderboard';
import ReferralLeaderboard from './ReferralLeaderboard';
import styles from './Leaderboard.module.css';

type LeaderboardTab = 'xp' | 'trading' | 'referral';

export default function Leaderboard(): JSX.Element {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('xp');

  const handleTabChange = useCallback((tabId: string): void => {
    setActiveTab(tabId as LeaderboardTab);
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('leaderboard.title')}</h1>
        <p className={styles.subtitle}>{t('leaderboard.subtitle')}</p>
      </header>

      <Tabs value={activeTab} onChange={handleTabChange} className={styles.tabs}>
        <TabList className={styles.tabList}>
          <Tab value='xp' id='tab-xp'>{t('leaderboard.tabs.xp')}</Tab>
          <Tab value='trading' id='tab-trading'>{t('leaderboard.tabs.trading')}</Tab>
          <Tab value='referral' id='tab-referral'>{t('leaderboard.tabs.referral')}</Tab>
        </TabList>
        <TabPanel value='xp' className={styles.tabPanel}>
          <XPLeaderboard />
        </TabPanel>
        <TabPanel value='trading' className={styles.tabPanel}>
          <TradingLeaderboard />
        </TabPanel>
        <TabPanel value='referral' className={styles.tabPanel}>
          <ReferralLeaderboard />
        </TabPanel>
      </Tabs>
    </div>
  );
}

