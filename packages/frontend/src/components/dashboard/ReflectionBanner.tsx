// ============================================================
// ReflectionBanner.tsx - AI Insight Banner
// ============================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function ReflectionBanner() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="glass-card mb-6 lg:mb-8 p-6 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6">
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent rounded-full opacity-10 blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative z-10 flex-1">
        <h2 className="text-xl font-bold text-gradient mb-2">
          {t('Understand Your Decisions. Improve Your Future.')}
        </h2>
        <p className="text-sm text-secondary mb-4 max-w-md">
          {t('Get weekly reflections, replay your trades and build your financial persona.')}
        </p>
        <button 
          onClick={() => navigate('/reflection')}
          className="btn-primary text-sm"
        >
          {t('Go to Reflection')} →
        </button>
      </div>

      <div className="relative z-10 w-32 h-32 flex items-center justify-center">
        <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-accent to-accent-glow rotate-45 shadow-lg shadow-accent-glow flex items-center justify-center">
          <span className="text-4xl -rotate-45">🧠</span>
        </div>
      </div>
    </div>
  );
}
