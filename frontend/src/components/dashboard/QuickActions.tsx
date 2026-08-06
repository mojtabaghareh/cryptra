// ============================================================
// QuickActions.tsx - Premium 4-Button Action Bar
// ============================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function QuickActions() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const actions = [
    { path: '/trade', label: 'Buy', icon: '↑', color: 'from-blue-500 to-accent' },
    { path: '/trade', label: 'Sell', icon: '↓', color: 'from-pink-500 to-danger' },
    { path: '/trade', label: 'Swap', icon: '↔', color: 'from-purple-500 to-accent-glow' },
    { path: '/wallet', label: 'Send', icon: '→', color: 'from-cyan-500 to-success' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 lg:mb-8">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => navigate(action.path)}
          className={`glass-card p-4 flex flex-col items-center gap-2 hover:scale-105 transition-all duration-300 border-border-glass hover:border-accent bg-gradient-to-br ${action.color} bg-opacity-20`}
        >
          <span className="text-2xl text-white font-bold">{action.icon}</span>
          <span className="text-sm font-medium text-white">{t(action.label)}</span>
        </button>
      ))}
    </div>
  );
}
