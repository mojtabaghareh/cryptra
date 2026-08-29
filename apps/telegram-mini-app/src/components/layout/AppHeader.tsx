import React from 'react';
import { useRouterState } from '@tanstack/react-router';
import { useTelegram } from '../../telegram/telegram';
import { useSessionStore } from '../../store/sessionStore';
import { useTranslation } from '../../lib/i18n';
import { ChevronLeft, Zap } from 'lucide-react';

export const AppHeader: React.FC = () => {
  const { user, haptic } = useTelegram();
  const sessionUser = useSessionStore((s) => s.user);
  const { lang, setLang } = useTranslation();
  const router = useRouterState();
  const currentPath = router.location.pathname;
  const isHome = currentPath === '/';

  const level = sessionUser?.level ?? 27;
  const xp = sessionUser?.xp ?? 850;

  return (
    <header className="sticky top-0 z-40 border-b border-blue-500/15 bg-[#050510]/85 backdrop-blur-xl shrink-0">
      <div className="flex items-center justify-between h-14 px-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {!isHome && (
            <button
              type="button"
              onClick={() => {
                haptic.light();
                window.history.back();
              }}
              className="p-1.5 rounded-lg text-cyan-200/80 hover:bg-white/5 shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-[0_0_16px_rgba(34,211,238,0.45)] shrink-0">
              <Zap className="w-4 h-4 text-white" fill="currentColor" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="font-bold text-[15px] tracking-tight text-white">Cryptra</div>
              <div className="text-[10px] text-cyan-300/60">mini app</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Language */}
          <div className="flex rounded-full border border-blue-500/30 bg-white/5 p-0.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setLang('en');
              }}
              className={`px-2 py-1 rounded-full transition ${
                lang === 'en' ? 'bg-blue-600 text-white' : 'text-white/50'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setLang('fa');
              }}
              className={`px-2 py-1 rounded-full transition ${
                lang === 'fa' ? 'bg-blue-600 text-white' : 'text-white/50'
              }`}
            >
              FA
            </button>
          </div>

          {/* Level chip */}
          <div className="hidden xs:flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-1">
            <span className="text-[10px] text-amber-300 font-semibold">🔥 Lv. {level}</span>
            <span className="text-[10px] text-white/50">{xp} XP</span>
          </div>

          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center text-xs font-bold border border-cyan-400/30">
            {(user?.first_name?.[0] || sessionUser?.firstName?.[0] || 'C').toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};
