import React from 'react';
import { useRouterState } from '@tanstack/react-router';
import { useTelegram } from '../../telegram/telegram';
import { ChevronLeft, Zap } from 'lucide-react';

export const AppHeader: React.FC = () => {
  const { user, haptic } = useTelegram();
  const router = useRouterState();
  const currentPath = router.location.pathname;
  const isHome = currentPath === '/';

  return (
    <header className="sticky top-0 z-40 border-b border-blue-500/15 bg-[#050510]/85 backdrop-blur-xl shrink-0">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          {!isHome && (
            <button
              type="button"
              onClick={() => {
                haptic.light();
                window.history.back();
              }}
              className="p-1.5 rounded-lg text-cyan-200/80 hover:bg-white/5"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-[0_0_16px_rgba(34,211,238,0.45)]">
              <Zap className="w-4 h-4 text-white" fill="currentColor" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-[15px] tracking-tight text-white">Cryptra</div>
              <div className="text-[10px] text-cyan-300/60">mini app</div>
            </div>
          </div>
        </div>

        {user && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-xs font-bold border border-cyan-400/30">
            {user.first_name?.[0] || '?'}
          </div>
        )}
      </div>
    </header>
  );
};
