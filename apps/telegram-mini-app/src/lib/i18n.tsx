import React, { createContext, useContext, useMemo } from 'react';

const dict: Record<string, string> = {
  'home.title': 'Cryptra',
  'home.subtitle': 'Understand how you decide',
  'home.connectPrompt': 'Connect a wallet to see your portfolio',
  'home.portfolio.label': 'Portfolio',
  'home.portfolio.totalBalance': 'Total balance',
  'home.portfolio.last24h': 'last 24h',
  'home.portfolio.error': 'Could not load portfolio',
  'home.portfolio.assetCount': '{count} assets',
  'home.wallet.label': 'Wallet',
  'home.wallet.address': 'Address',
  'home.quickActions.label': 'Quick actions',
  'home.quickActions.title': 'Quick actions',
  'home.action.swap': 'Swap',
  'home.action.send': 'Send',
  'home.action.receive': 'Receive',
  'home.action.buy': 'Buy',
  'home.market.label': 'Markets',
  'home.market.title': 'Markets',
  'home.market.comingSoon': 'Live markets loading…',
  'wallet.status.connected': 'Connected',
  'wallet.status.disconnected': 'Disconnected',
  'wallet.action.connect': 'Connect wallet',
  'wallet.action.disconnect': 'Disconnect',
  'common.retry': 'Retry',
};

function translate(key: string, params?: Record<string, string | number>): string {
  let text = dict[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

const I18nContext = createContext({ t: translate });

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(() => ({ t: translate }), []);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  return useContext(I18nContext);
}

export function initI18n() {
  // no-op for local fallback
}
