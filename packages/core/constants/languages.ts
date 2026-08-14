/** Languages supported per Master Specification §27. */
export const SUPPORTED_LANGUAGES = {
  persian: 'fa',
  english: 'en',
  arabic: 'ar',
  turkish: 'tr',
  russian: 'ru',
  chinese: 'zh',
  afrikaans: 'af',
  japanese: 'ja',
  korean: 'ko',
  german: 'de',
} as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[keyof typeof SUPPORTED_LANGUAGES];

export const RTL_LANGUAGES: readonly SupportedLanguage[] = ['fa', 'ar'];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export function isRtlLanguage(lang: SupportedLanguage): boolean {
  return RTL_LANGUAGES.includes(lang);
}
