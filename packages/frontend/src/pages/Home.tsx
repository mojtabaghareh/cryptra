// ============================================================
// Home.tsx (نسخه‌ی Premium با طراحی شیشه‌ای و نئون)
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [portfolio, setPortfolio] = useState({
    total: 24500,
    todayChange: 320,
    monthChange: -150,
    changePercent: 8.2,
  });

  const [insights, setInsights] = useState([
    '⚠️ این هفته ۲ بار در زمان افزایش قیمت خرید کرده‌اید.',
    '✅ این هفته نسبت به هفته قبل صبورتر بوده‌اید.',
  ]);

  return (
    <div className="container pb-4">
      {/* هدر پریمیوم */}
      <div className="flex justify-between items-center mb-8 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center shadow-lg shadow-accent-glow">
            <span className="text-2xl">🔷</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gradient">Cryptra</h1>
            <p className="text-xs text-secondary">Financial Intelligence</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </button>
          <button className="btn-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>

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
    </div>
  );
}
