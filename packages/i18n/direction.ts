export const SUPPORTED_LOCALES = [
  'fa',
  'en',
  'ar',
  'tr',
  'ru',
  'zh',
  'af',
  'ja',
  'ko',
  'de',
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  fa: 'فارسی',
  en: 'English',
  ar: 'العربية',
  tr: 'Türkçe',
  ru: 'Русский',
  zh: '中文',
  af: 'Afrikaans',
  ja: '日本語',
  ko: '한국어',
  de: 'Deutsch',
};

export const RTL_LOCALES: readonly SupportedLocale[] = ['fa', 'ar'];

export function isRTL(locale: SupportedLocale): boolean {
  return RTL_LOCALES.includes(locale);
}

export function getDirection(locale: SupportedLocale): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

export function getTextAlign(locale: SupportedLocale): 'left' | 'right' {
  return isRTL(locale) ? 'right' : 'left';
}

export function getFlexDirection(locale: SupportedLocale): 'row' | 'row-reverse' {
  return isRTL(locale) ? 'row-reverse' : 'row';
}

export function setDocumentDirection(locale: SupportedLocale): void {
  if (typeof document === 'undefined') return;
  const dir = getDirection(locale);
  document.documentElement.dir = dir;
  document.documentElement.lang = locale;
  document.documentElement.setAttribute('data-dir', dir);
}

