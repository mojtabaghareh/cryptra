import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';

type Lang = 'en' | 'fa';

const en: Record<string, string> = {
  'home.hero1': 'Trade Smarter.',
  'home.hero2': 'Grow Faster.',
  'home.tagline': 'Your journey to financial mastery.',
  'home.totalBalance': 'Total Balance',
  'home.today': 'Today',
  'home.demoBalance': 'Demo balance · Connect or open in Telegram',
  'home.connectWallet': 'Connect Wallet',
  'home.action.buy': 'Buy',
  'home.action.sell': 'Sell',
  'home.action.swap': 'Swap',
  'home.action.send': 'Send',
  'home.dailyBonus': 'Daily Bonus',
  'home.dailyBonusDesc': 'Complete daily tasks and earn XP & rewards!',
  'home.claimNow': 'Claim Now',
  'home.topCoins': 'Top Coins',
  'home.viewAll': 'View All',
  'nav.home': 'Home',
  'nav.markets': 'Markets',
  'nav.trade': 'Trade',
  'nav.wallet': 'Wallet',
  'nav.profile': 'Profile',
  'markets.title': 'Markets',
  'markets.search': 'Search coin or token…',
  'wallet.connect': 'Connect wallet',
  'wallet.disconnect': 'Disconnect',
  'common.retry': 'Retry',
  'lang.en': 'EN',
  'lang.fa': 'FA',
};

const fa: Record<string, string> = {
  'home.hero1': 'هوشمندتر معامله کن.',
  'home.hero2': 'سریع‌تر رشد کن.',
  'home.tagline': 'مسیر تو به تسلط مالی.',
  'home.totalBalance': 'موجودی کل',
  'home.today': 'امروز',
  'home.demoBalance': 'موجودی دمو · وصل شو یا از تلگرام باز کن',
  'home.connectWallet': 'اتصال کیف‌پول',
  'home.action.buy': 'خرید',
  'home.action.sell': 'فروش',
  'home.action.swap': 'تبدیل',
  'home.action.send': 'ارسال',
  'home.dailyBonus': 'پاداش روزانه',
  'home.dailyBonusDesc': 'تسک‌های روزانه را انجام بده و XP بگیر!',
  'home.claimNow': 'دریافت',
  'home.topCoins': 'برترین ارزها',
  'home.viewAll': 'همه',
  'nav.home': 'خانه',
  'nav.markets': 'بازار',
  'nav.trade': 'معامله',
  'nav.wallet': 'کیف‌پول',
  'nav.profile': 'پروفایل',
  'markets.title': 'بازارها',
  'markets.search': 'جستجوی ارز…',
  'wallet.connect': 'اتصال کیف‌پول',
  'wallet.disconnect': 'قطع اتصال',
  'common.retry': 'تلاش دوباره',
  'lang.en': 'EN',
  'lang.fa': 'FA',
};

const dicts: Record<Lang, Record<string, string>> = { en, fa };

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'en';
    return (localStorage.getItem('cryptra-lang') as Lang) || 'en';
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('cryptra-lang', l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'fa' ? 'rtl' : 'ltr';
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  }, [lang]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      let text = dicts[lang][key] ?? dicts.en[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{${k}}`, String(v));
        }
      }
      return text;
    },
    [lang],
  );

  const value = useMemo(
    () => ({ lang, setLang, t, dir: (lang === 'fa' ? 'rtl' : 'ltr') as 'ltr' | 'rtl' }),
    [lang, setLang, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      lang: 'en' as Lang,
      setLang: () => undefined,
      t: (k: string) => k,
      dir: 'ltr' as const,
    };
  }
  return ctx;
}

export function initI18n() {
  // no-op
}
