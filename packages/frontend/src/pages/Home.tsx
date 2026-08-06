// ============================================================
// Home.tsx (نسخه نهایی - دسکتاپ و موبایل)
// ============================================================

import React from 'react';
import { useTranslation } from 'react-i18next';
import ResponsiveLayout from '../components/layout/ResponsiveLayout';
import PortfolioOverview from '../components/dashboard/PortfolioOverview';
import QuickActions from '../components/dashboard/QuickActions';
import TopMovers from '../components/dashboard/TopMovers';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import PortfolioAllocation from '../components/dashboard/PortfolioAllocation';
import MarketSentiment from '../components/dashboard/MarketSentiment';
import ReflectionBanner from '../components/dashboard/ReflectionBanner';

export default function Home() {
  const { t } = useTranslation();

  return (
    <ResponsiveLayout>
      {/* بخش بالایی: پورتفولیو و دکمه‌ها */}
      <PortfolioOverview />
      <QuickActions />

      {/* دو ستون وسطی */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 lg:mb-8">
        <TopMovers />
        <RecentTransactions />
      </div>

      {/* بنر Reflection */}
      <ReflectionBanner />

      {/* دو ستون پایینی */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PortfolioAllocation />
        <MarketSentiment />
      </div>
    </ResponsiveLayout>
  );
}
