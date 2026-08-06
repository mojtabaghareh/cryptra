// ============================================================
// App.tsx (نسخه نهایی با تم تاریک، مسیریابی درست و Glassmorphism)
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

// سیستم چندزبانه
import './i18n';

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // تنظیم تم پیش‌فرض (Dark Mode)
    document.documentElement.setAttribute('data-theme', theme);
    // جلوگیری از اسکرول افقی در موبایل
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
