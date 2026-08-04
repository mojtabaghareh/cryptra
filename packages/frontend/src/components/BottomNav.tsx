// ============================================================
// BottomNav.tsx
// نوار ناوبری پایین صفحه (Bottom Navigation)
// ============================================================

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { path: '/home', icon: '🏠', label: 'Home' },
    { path: '/trade', icon: '⚡', label: 'Trade' },
    { path: '/reflection', icon: '🪞', label: 'Reflection' },
    { path: '/portfolio', icon: '💼', label: 'Portfolio' },
    { path: '/wallet', icon: '👛', label: 'Wallet' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive ? 'text-blue-500' : 'text-gray-400'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-1">{t(item.label)}</span>
              {isActive && <div className="w-6 h-1 bg-blue-500 rounded-full mt-1" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
