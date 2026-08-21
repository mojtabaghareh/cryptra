import React from 'react';
import { useRouterState } from '@tanstack/react-router';
import { useTelegram } from '../../telegram/telegram';
import { Zap, ChevronLeft } from 'lucide-react';

export const AppHeader: React.FC = () => {
  const { user, haptic } = useTelegram();
  const router = useRouterState();
  const currentPath = router.location.pathname;
  const isHome = currentPath === '/';

  const handleBack = () => {
    haptic.light();
    window.history.back();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur shrink-0">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          {!isHome && (
            <button
              type="button"
              onClick={handleBack}
              className="p-1.5 rounded-lg text-white/70 hover:bg-white/5"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-transparent">
              Cryptra
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium">
              {user.first_name?.[0] || '?'}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
