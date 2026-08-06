// ============================================================
// MainLayout.tsx (نسخه نهایی و پریمیوم - چیدمان اصلی اپ)
// ============================================================

import React from 'react';
import BottomNav from './BottomNav';
import Header from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  hideBottomNav?: boolean;
}

export default function MainLayout({ 
  children, 
  title, 
  showBack, 
  onBack, 
  hideBottomNav = false 
}: MainLayoutProps) {
  return (
    <div className="container min-h-screen pb-4 overflow-x-hidden">
      <Header title={title} showBack={showBack} onBack={onBack} />
      <main className="flex-1">
        {children}
      </main>
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}
