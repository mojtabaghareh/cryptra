// ============================================================
// Sidebar.tsx - Premium Desktop Sidebar
// ============================================================

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const menuItems = [
    { path: '/home', icon: '🏠', label: 'Home' },
    { path: '/markets', icon: '📊', label: 'Markets' },
    { path: '/trade', icon: '⚡', label: 'Trade' },
    { path: '/portfolio', icon: '💼', label: 'Portfolio' },
    { path: '/reflection', icon: '🪞', label: 'Reflection' },
    { path: '/replay', icon: '📅', label: 'Replay' },
    { path: '/persona', icon: '🧠', label: 'Persona', badge: 'New' },
    { path: '/alerts', icon: '🔔', label: 'Alerts' },
    { path: '/rewards', icon: '⭐', label: 'Rewards' },
    { path: '/activity', icon: '⚡', label: 'Activity' },
    { path: '/settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <aside className="w-64 glass border-r border-border-glass h-screen sticky top-0 flex flex-col p-4 hidden lg:flex">
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center shadow-lg shadow-accent-glow">
          <span className="text-sm">🔷</span>
        </div>
        <span className="text-xl font-bold text-gradient">Cryptra</span>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ${
                isActive 
                  ? 'bg-accent/20 text-accent border border-accent/30 shadow-glow-accent' 
                  : 'text-secondary hover:text-primary hover:bg-white/5'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-medium flex-1 text-left">{t(item.label)}</span>
              {item.badge && (
                <span className="text-[10px] bg-accent text-white px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 pt-4 border-t border-border-glass">
        <div className="gradient-card p-3 relative overflow-hidden rounded-xl">
          <div className="relative z-10">
            <p className="text-white font-semibold text-sm">Cryptra PRO</p>
            <p className="text-white/70 text-xs mt-1">Unlock advanced insights</p>
            <button className="mt-2 w-full glass text-xs py-1.5 rounded-lg text-white hover:bg-white/20 transition">
              Upgrade Now →
            </button>
          </div>
        </div>

        <div className="glass p-3 rounded-xl border border-border-glass flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-lg">
            👤
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Trader</p>
            <p className="text-[10px] text-secondary">Level 27 • 2,450 XP</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
