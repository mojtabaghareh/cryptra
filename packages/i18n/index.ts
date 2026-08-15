// Direction & Locale utilities
export {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_NAMES,
  RTL_LOCALES,
  isRTL,
  getDirection,
  getTextAlign,
  getFlexDirection,
  setDocumentDirection,
} from './direction';
export type { SupportedLocale } from './direction';

// i18n Service
export {
  initI18n,
  changeLanguage,
  getCurrentLocale,
  getCurrentDirection,
  i18n,
} from './I18nService';
