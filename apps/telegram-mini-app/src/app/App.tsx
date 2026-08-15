import React from 'react';
import { Outlet } from '@tanstack/react-router';
import { AppHeader } from '../components/layout/AppHeader';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import { PageContainer } from '../components/layout/PageContainer';

export const App: React.FC = () => {
  return (
    <div className="flex flex-col h-[100dvh] bg-cryptra-background text-cryptra-foreground overflow-hidden">
      <AppHeader />
      <PageContainer>
        <Outlet />
      </PageContainer>
      <BottomNavigation />
    </div>
  );
};

