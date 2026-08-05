import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// ایمپورت تمام فایل‌های ترجمه
import en from './locales/en.json';
import fa from './locales/fa.json';
import ar from './locales/ar.json';
import tr from './locales/tr.json';
import ru from './locales/ru.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import zh from './locales/zh.json';

const resources = {
  en: { translation: en },
  fa: { translation: fa },
  ar: { translation: ar },
  tr: { translation: tr },
  ru: { translation: ru },
  de: { translation: de },
  fr: { translation: fr },
  es: { translation: es },
  pt: { translation: pt },
  zh: { translation: zh },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // زبان پیش‌فرض
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
