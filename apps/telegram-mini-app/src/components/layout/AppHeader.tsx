import React from 'react';
import { useRouterState } from '@tanstack/react-router';
import { useI18n } from '@cryptra/i18n';
import { useTelegram } from '../../telegram/telegram';
import { Button } from '@cryptra/ui';
import { Zap, Globe, ChevronLeft } from 'lucide-react';

export const AppHeader: React.FC = () => {
  const { t, locale, setLocale, supportedLocales, localeNames } = useI18n();
  const { webApp, user, haptic } = useTelegram();
  const router = useRouterState();
  const currentPath = router.location.pathname;
  const isHome = currentPath === '/';

  const toggleLanguage = () => {
    haptic.light();
    const currentIndex = supportedLocales.indexOf(locale);
    const nextIndex = (currentIndex + 1) % supportedLocales.length;
    setLocale(supportedLocales[nextIndex]);
  };

  const handleBack = () => {
    haptic.light();
    window.history.back();
  };

  return (
    <header className="sticky top-0 z-40 glass border-b border-cryptra-border shrink-0">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          {!isHome && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cryptra-neon-blue to-cryptra-neon-purple flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text">{t('common:appName')}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="text-xs font-medium"
          >
            <Globe className="w-4 h-4 mr-1" />
            {localeNames[locale]}
          </Button>
          {user && (
            <div className="w-8 h-8 rounded-full bg-cryptra-muted flex items-center justify-center text-sm font-medium text-cryptra-foreground">
              {user.first_name?.[0] || '?'}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

