// ============================================================
// Reflection.tsx (نسخه‌ی نهایی - پریمیوم با Insights)
// ============================================================

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function Reflection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [replay, setReplay] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setReplay({
        weekNumber: 32,
        totalEvents: 14,
        insights: [
          { type: 'warning', text: '⚠️ این هفته ۳ بار نزدیک بود تصمیم هیجانی بگیری.' },
          { type: 'success', text: '✅ این هفته نسبت به هفته قبل ۱۲٪ صبورتر بودی.' },
          { type: 'info', text: '📈 بهترین معامله‌های تو در ساعت ۱۰ صبح انجام شده است.' },
        ],
        patterns: [
          { type: 'FOMO', count: 2, icon: '🚀' },
          { type: 'PANIC_SELL', count: 1, icon: '📉' },
        ],
        summary: 'این هفته الگوهای FOMO و Panic Sell در رفتار شما مشاهده شد. آگاهی از این الگوها اولین قدم برای بهبود است.',
      });
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return (
      <div className="container flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full glass flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-3xl">🪞</span>
          </div>
          <p className="text-secondary">{t('Loading your reflection...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container pb-4">
      {/* هدر پریمیوم */}
      <div className="flex items-center justify-between mb-6 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center shadow-lg shadow-accent-glow">
            <span className="text-lg">🪞</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gradient">{t('Reflection')}</h1>
        </div>
        <div className="glass px-3 py-1.5 rounded-lg border border-border-glass">
          <span className="text-xs text-secondary font-medium">Week {replay.weekNumber}</span>
        </div>
      </div>

      {/* کارت خلاصه هفتگی پریمیوم */}
      <div className="gradient-card mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent rounded-full opacity-10 blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent rounded-full opacity-10 blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-white/70">{t('Weekly Summary')}</p>
              <p className="text-lg font-semibold mt-1 text-white leading-relaxed max-w-[80%]">
                {replay.summary}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-white/50">{t('Events')}</span>
              <p className="text-2xl font-bold text-white">{replay.totalEvents}</p>
            </div>
          </div>
        </div>
      </div>

      {/* بینش‌ها (Insights) */}
      <div className="glass-card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
            <span className="text-sm">💡</span>
          </div>
          <h2 className="text-sm font-semibold text-primary">{t('Insights')}</h2>
        </div>
        <div className="space-y-3">
          {replay.insights.map((insight: any, index: number) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                insight.type === 'warning' 
                  ? 'bg-warning/10 border-warning/20' 
                  : insight.type === 'success'
                  ? 'bg-success/10 border-success/20'
                  : 'bg-accent/10 border-accent/20'
              }`}
            >
              <span className="text-sm mt-0.5">{insight.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* الگوهای رفتاری (Patterns) */}
      <div className="glass-card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
            <span className="text-sm">📊</span>
          </div>
          <h2 className="text-sm font-semibold text-primary">{t('Patterns')}</h2>
        </div>
        <div className="space-y-3">
          {replay.patterns.map((pattern: any, index: number) => (
            <div
              key={index}
              className="flex justify-between items-center p-3 rounded-lg glass border border-border-glass hover:border-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{pattern.icon}</span>
                <span className="text-sm text-secondary">{pattern.type}</span>
              </div>
              <span className="bg-accent/20 text-accent text-xs px-3 py-1 rounded-full font-medium">
                {pattern.count}x
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* دکمه مشاهده گزارش کامل */}
      <button
        onClick={() => navigate('/replay')}
        className="w-full py-4 bg-gradient-to-r from-accent to-accent-glow text-white text-sm font-bold rounded-xl shadow-lg shadow-accent-glow hover:shadow-xl hover:shadow-accent-glow/50 transition-all duration-300 transform hover:-translate-y-0.5"
      >
        {t('View Full Report')} →
      </button>
    </div>
  );
}