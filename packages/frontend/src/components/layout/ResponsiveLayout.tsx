// ============================================================
// ResponsiveLayout.tsx - Responsive Layout for Web & Mobile
// ============================================================

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import BottomNav from '../BottomNav';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-primary text-primary overflow-x-hidden">
      {isDesktop && <Sidebar />}
      <div className="flex-1 flex flex-col">
        <TopHeader isDesktop={isDesktop} />
        <main className="flex-1 p-4 lg:p-8">
          <div className="container mx-auto max-w-7xl">
            {children}
          </div>
        </main>
        {!isDesktop && <BottomNav />}
      </div>
    </div>
  );
}
