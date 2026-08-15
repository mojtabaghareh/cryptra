import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import {
  type SupportedLocale,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  setDocumentDirection,
} from './direction';

import fa from './locales/fa.json';
import en from './locales/en.json';
import ar from './locales/ar.json';
import tr from './locales/tr.json';
import ru from './locales/ru.json';
import zh from './locales/zh.json';
import af from './locales/af.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import de from './locales/de.json';

const resources: Record<SupportedLocale, { translation: Record<string, unknown> }> = {
  fa: { translation: fa },
  en: { translation: en },
  ar: { translation: ar },
  tr: { translation: tr },
  ru: { translation: ru },
  zh: { translation: zh },
  af: { translation: af },
  ja: { translation: ja },
  ko: { translation: ko },
  de: { translation: de },
};

let initialized = false;

export function initI18n(): typeof i18n {
  if (initialized) return i18n;

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: DEFAULT_LOCALE,
      supportedLngs: [...SUPPORTED_LOCALES],
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
        lookupLocalStorage: 'cryptra-language',
      },
    });

  i18n.on('languageChanged', (lng: string) => {
    setDocumentDirection(lng as SupportedLocale);
  });

  initialized = true;
  return i18n;
}

export function changeLanguage(locale: SupportedLocale): Promise<void> {
  return i18n.changeLanguage(locale);
}

export function getCurrentLocale(): SupportedLocale {
  return (i18n.language as SupportedLocale) || DEFAULT_LOCALE;
}

export function getCurrentDirection(): 'ltr' | 'rtl' {
  const locale = getCurrentLocale();
  return locale === 'fa' || locale === 'ar' ? 'rtl' : 'ltr';
}

export { i18n };
export type { SupportedLocale };

