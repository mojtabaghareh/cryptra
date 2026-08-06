// ============================================================
// BottomNav.tsx (نسخه نهایی - نوار ناوبری پریمیوم)
// ============================================================

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { path: '/home', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
      </svg>
    ), label: 'Home' },
    { path: '/trade', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ), label: 'Trade' },
    { path: '/reflection', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
    ), label: 'Reflection' },
    { path: '/portfolio', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
      </svg>
    ), label: 'Portfolio' },
    { path: '/wallet', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ), label: 'Wallet' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 glass border-t border-border-glass pb-safe z-50">
      <div className="flex justify-around items-center h-[72px] max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center justify-center w-full h-full transition-all duration-300 ease-in-out group"
            >
              <div className={`transition-all duration-300 ${
                isActive 
                  ? 'text-accent transform -translate-y-1 scale-110 drop-shadow-[0_0_8px_rgba(74,144,217,0.5)]' 
                  : 'text-secondary group-hover:text-primary'
              }`}>
                {item.icon}
              </div>
              <span className={`text-[10px] mt-1 font-medium transition-all duration-300 ${
                isActive ? 'text-accent' : 'text-muted group-hover:text-secondary'
              }`}>
                {t(item.label)}
              </span>
              {isActive && (
                <div className="absolute -top-1 w-8 h-1 bg-gradient-to-r from-accent to-accent-glow rounded-full shadow-[0_0_10px_rgba(74,144,217,0.6)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
