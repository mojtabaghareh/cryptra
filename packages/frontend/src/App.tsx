// ============================================================
// App.tsx - Final Production Version (Web & Telegram)
// ============================================================

import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// صفحات
import Home from './pages/Home';
import Markets from './pages/Markets';
import Trade from './pages/Trade';
import Portfolio from './pages/Portfolio';
import Reflection from './pages/Reflection';
import Analytics from './pages/Analytics';
import Alerts from './pages/Alerts';
import Persona from './pages/Persona';
import Settings from './pages/Settings';
import Replay from './pages/Replay';
import Wallet from './pages/Wallet';

// کامپوننت‌های مشترک
import BottomNav from './components/BottomNav';

// استایل‌های سراسری
import './index.css';
import './i18n';

// تعریف تایپ تلگرام برای TypeScript
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        platform: string;
        colorScheme: 'dark' | 'light';
        themeParams: {
          bg_color: string;
          text_color: string;
          button_color: string;
        };
      };
    };
  }
}

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    // 1. تشخیص محیط اجرا
    const tg = window.Telegram?.WebApp;
    const isRunningInTelegram = !!tg;
    setIsTelegram(isRunningInTelegram);

    if (isRunningInTelegram) {
      // === محیط تلگرام ===
      tg.ready();
      tg.expand();

      // تنظیم تم بر اساس تنظیمات کاربر در تلگرام
      const tgTheme = tg.colorScheme;
      if (tgTheme) {
        setTheme(tgTheme);
        document.documentElement.setAttribute('data-theme', tgTheme);
      }

      // اگر تلگرام تم پارامترهای خاصی بدهد، می‌توانیم آن‌ها را به CSS پاس دهیم
      if (tg.themeParams) {
        document.documentElement.style.setProperty('--tg-bg-color', tg.themeParams.bg_color);
        document.documentElement.style.setProperty('--tg-text-color', tg.themeParams.text_color);
        document.documentElement.style.setProperty('--tg-button-color', tg.themeParams.button_color);
      }

      console.log('📱 Cryptra running inside Telegram');
    } else {
      // === محیط مرورگر وب ===
      document.documentElement.setAttribute('data-theme', theme);
      console.log('🖥️ Cryptra running in Web Browser');
    }

    // جلوگیری از اسکرول افقی
    document.body.style.overflowX = 'hidden';
  }, [theme]);

  return (
    <Router>
      <div className="min-h-screen bg-primary text-primary pb-20 container overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/trade" element={<Trade />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/reflection" element={<Reflection />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/persona" element={<Persona />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/replay" element={<Replay />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;