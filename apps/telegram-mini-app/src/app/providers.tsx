import React from 'react';
import { I18nProvider, initI18n } from '../lib/i18n';
import { ThemeProvider } from '../telegram/theme';
import { TelegramProvider } from '../telegram/telegram';
import { SessionBootstrap } from './SessionBootstrap';

initI18n();

/**
 * Order matters:
 * TelegramProvider must wrap ThemeProvider because ThemeProvider calls useTelegram().
 */
export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <I18nProvider>
      <TelegramProvider>
        <ThemeProvider>
          <SessionBootstrap />
          {children}
        </ThemeProvider>
      </TelegramProvider>
    </I18nProvider>
  );
};
