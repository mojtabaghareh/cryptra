import React from 'react';
import { I18nProvider, initI18n } from '../lib/i18n';
import { ThemeProvider } from '../telegram/theme';
import { TelegramProvider } from '../telegram/telegram';
import { SessionBootstrap } from './SessionBootstrap';

initI18n();

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <I18nProvider>
      <ThemeProvider>
        <TelegramProvider>
          <SessionBootstrap />
          {children}
        </TelegramProvider>
      </ThemeProvider>
    </I18nProvider>
  );
};
