// ============================================================
// Settings.tsx (نسخه نهایی و پریمیوم - صفحه تنظیمات)
// ============================================================

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Settings() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [language, setLanguage] = useState('en');

  return (
    <div className="container pb-4">
      {/* هدر پریمیوم */}
      <div className="flex items-center justify-between mb-6 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center shadow-lg shadow-accent-glow">
            <span className="text-lg">⚙️</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gradient">{t('Settings')}</h1>
        </div>
      </div>

      {/* گروه تنظیمات */}
      <div className="space-y-4">
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-primary mb-3">Appearance</h3>
          <div className="flex justify-between items-center">
            <span className="text-sm text-secondary">Theme</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}
              className="glass px-3 py-1 rounded-lg text-sm text-secondary outline-none border border-border-glass"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
        </div>

        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-primary mb-3">Language</h3>
          <div className="flex justify-between items-center">
            <span className="text-sm text-secondary">App Language</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="glass px-3 py-1 rounded-lg text-sm text-secondary outline-none border border-border-glass"
            >
              <option value="en">English</option>
              <option value="fa">فارسی</option>
              <option value="ar">العربية</option>
              <option value="tr">Türkçe</option>
              <option value="ru">Русский</option>
            </select>
          </div>
        </div>

        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-primary mb-3">Security</h3>
          <div className="flex justify-between items-center py-2 border-b border-border-glass">
            <span className="text-sm text-secondary">Two-Factor Auth</span>
            <button className="text-xs text-accent font-medium">Enable</button>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm text-secondary">Export Memory</span>
            <button className="text-xs text-accent font-medium">Export</button>
          </div>
        </div>
      </div>
    </div>
  );
}
