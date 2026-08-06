// ============================================================
// Home.tsx (نسخه نهایی و پریمیوم با کامپوننت‌های Layout)
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MainLayout from '../components/MainLayout';

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [portfolio] = useState({
    total: 24500,
    todayChange: 320,
    monthChange: -150,
    changePercent: 8.2,
  });

  const insights = [
    '⚠️ این هفته ۲ بار در زمان افزایش قیمت خرید کرده‌اید.',
    '✅ این هفته نسبت به هفته قبل صبورتر بوده‌اید.',
  ];

  return (
    <MainLayout title="Cryptra">
      {/* کارت پورتفولیو پریمیوم */}
      <div className="gradient-card mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent rounded-full opacity-10 blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent rounded-full opacity-10 blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-white/70">{t('Total Portfolio')}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-4xl font-bold text-white">
                  ${portfolio.total.toLocaleString()}
                </p>
                <span className="text-xs text-white/60 mt-2">USD</span>
              </div>
            </div>
            <div className="glass px-3 py-1.5 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${portfolio.todayChange >= 0 ? 'bg-success' : 'bg-danger'}`} />
                <span className={`text-xs font-semibold ${portfolio.todayChange >= 0 ? 'text-success' : 'text-danger'}`}>
                  {portfolio.todayChange >= 0 ? '+24h' : '24h'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-6 mt-4">
            <div>
              <p className={`text-sm font-medium ${portfolio.todayChange >= 0 ? 'text-success' : 'text-danger'}`}>
                {portfolio.todayChange >= 0 ? '▲' : '▼'} ${Math.abs(portfolio.todayChange).toLocaleString()}
              </p>
              <p className="text-xs text-white/50">Today</p>
            </div>
            <div>
              <p className={`text-sm font-medium ${portfolio.monthChange >= 0 ? 'text-success' : 'text-danger'}`}>
                {portfolio.monthChange >= 0 ? '▲' : '▼'} ${Math.abs(portfolio.monthChange).toLocaleString()}
              </p>
              <p className="text-xs text-white/50">30d</p>
            </div>
            <div>
              <p className={`text-sm font-medium ${portfolio.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
                {portfolio.changePercent >= 0 ? '▲' : '▼'} {Math.abs(portfolio.changePercent).toFixed(1)}%
              </p>
              <p className="text-xs text-white/50">ROI</p>
            </div>
          </div>
        </div>
      </div>

      {/* کارت بازتاب شیشه‌ای */}
      <div className="glass-card mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-sm">🪞</span>
            </div>
            <h2 className="text-sm font-semibold text-primary">{t('Weekly Reflection')}</h2>
          </div>
          <span className="text-xs text-secondary glass px-2 py-0.5 rounded-full">Week 32</span>
        </div>
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
              <span className="text-sm mt-0.5">•</span>
              <span className="text-sm text-secondary leading-relaxed">{insight}</span>
            </div>
          ))}
        </div>
        <button 
          onClick={() => navigate('/reflection')}
          className="w-full mt-4 btn-outline text-center flex items-center justify-center gap-2"
        >
          <span>View Full Analysis</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* دکمه‌های اقدام سریع پریمیوم */}
      <div className="grid grid-cols-4 gap-3">
        <button 
          onClick={() => navigate('/trade')}
          className="glass-card flex flex-col items-center justify-center p-4 hover:bg-card-hover border-border-glass hover:border-accent transition-all duration-300"
        >
          <span className="text-xl text-accent mb-1">↑</span>
          <span className="text-xs text-secondary font-medium">{t('Buy')}</span>
        </button>
        <button 
          onClick={() => navigate('/trade')}
          className="glass-card flex flex-col items-center justify-center p-4 hover:bg-card-hover border-border-glass hover:border-accent transition-all duration-300"
        >
          <span className="text-xl text-danger mb-1">↓</span>
          <span className="text-xs text-secondary font-medium">{t('Sell')}</span>
        </button>
        <button 
          onClick={() => navigate('/trade')}
          className="glass-card flex flex-col items-center justify-center p-4 hover:bg-card-hover border-border-glass hover:border-accent transition-all duration-300"
        >
          <span className="text-xl text-success mb-1">↔</span>
          <span className="text-xs text-secondary font-medium">{t('Swap')}</span>
        </button>
        <button 
          onClick={() => navigate('/wallet')}
          className="glass-card flex flex-col items-center justify-center p-4 hover:bg-card-hover border-border-glass hover:border-accent transition-all duration-300"
        >
          <span className="text-xl text-warning mb-1">→</span>
          <span className="text-xs text-secondary font-medium">{t('Send')}</span>
        </button>
      </div>
    </MainLayout>
  );
}
