// ============================================================
// App.tsx (نسخه‌ی جدید با پالت رنگی و استایل)
// ============================================================

import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// صفحات
import Home from './pages/Home';
import Trade from './pages/Trade';
import Reflection from './pages/Reflection';
import Portfolio from './pages/Portfolio';
import Wallet from './pages/Wallet';

// کامپوننت‌های مشترک
import BottomNav from './components/BottomNav';

// استایل‌های سراسری
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-primary text-primary pb-20">
        <Routes>
          <Route path="/" element={<Navigate to="/home" />} />
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
