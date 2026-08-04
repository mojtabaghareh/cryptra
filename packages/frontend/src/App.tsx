// ============================================================
// App.tsx
// فایل اصلی ساختار اپلیکیشن (Telegram Mini App + Web)
// ============================================================

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// صفحات اصلی
import Home from './pages/Home';
import Trade from './pages/Trade';
import Reflection from './pages/Reflection';
import Portfolio from './pages/Portfolio';
import Wallet from './pages/Wallet';

// کامپوننت‌های مشترک
import BottomNav from './components/BottomNav';

// پشتیبانی از چند زبان
import './i18n';

function App() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // بررسی وجود کاربر از طریق API
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('cryptra_token');
        if (token) {
          setUser({ id: 'temp-user' }); // در نسخه واقعی از API گرفته می‌شود
        }
      } catch (error) {
        console.error('خطا در بررسی احراز هویت:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🔷</div>
          <p className="text-lg">Cryptra is loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white pb-20">
        <Routes>
          <Route
            path="/"
            element={user ? <Navigate to="/home" /> : <Navigate to="/wallet" />}
          />
          <Route path="/home" element={<Home />} />
          <Route path="/trade" element={<Trade />} />
          <Route path="/reflection" element={<Reflection />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="*" element={<Navigate to="/home" />} />
        </Routes>
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;
