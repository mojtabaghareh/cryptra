// ============================================================
// Reflection.tsx
// صفحه تحلیل رفتار، گزارش هفتگی و بینش‌های شخصی
// ============================================================

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function Reflection() {
  const [replay, setReplay] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // شبیه‌سازی دریافت داده از API
    setTimeout(() => {
      setReplay({
        weekNumber: 32,
        totalEvents: 14,
        insights: [
          '⚠️ این هفته ۳ بار نزدیک بود تصمیم هیجانی بگیری.',
          '✅ این هفته نسبت به هفته قبل ۱۲٪ صبورتر بودی.',
          '📈 بهترین معامله‌های تو در ساعت ۱۰ صبح انجام شده است.',
        ],
        patterns: [
          { type: 'FOMO', count: 2 },
          { type: 'PANIC_SELL', count: 1 },
        ],
        summary: 'این هفته الگوهای FOMO و Panic Sell در رفتار شما مشاهده شد. آگاهی از این الگوها اولین قدم برای بهبود است.',
      });
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl animate-pulse mb-2">🪞</div>
          <p className="text-secondary">Loading your reflection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* هدر صفحه */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-3xl">🪞</span>
        <h1 className="text-2xl font-bold">Reflection</h1>
        <span className="bg-card border border-border text-xs text-secondary px-2 py-0.5 rounded-full ml-auto">
          Week {replay.weekNumber}
        </span>
      </div>

      {/* کارت خلاصه هفتگی */}
      <div className="gradient-card mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm opacity-80">Weekly Summary</p>
            <p className="text-xl font-semibold mt-1">{replay.summary}</p>
          </div>
          <div className="text-right">
            <span className="text-sm opacity-80">Events</span>
            <p className="text-xl font-bold">{replay.totalEvents}</p>
          </div>
        </div>
      </div>

      {/* بینش‌ها (Insights) */}
      <div className="card border-border mb-6">
        <h2 className="text-lg font-semibold text-secondary mb-3 flex items-center gap-2">
          <span>💡</span> Insights
        </h2>
        <ul className="space-y-3">
          {replay.insights.map((insight: string, index: number) => (
            <li key={index} className="flex items-start gap-3 text-sm">
              <span className="text-primary mt-0.5">•</span>
              <span className="text-secondary">{insight}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* الگوهای رفتاری (Patterns) */}
      <div className="card border-border mb-6">
        <h2 className="text-lg font-semibold text-secondary mb-3 flex items-center gap-2">
          <span>📊</span> Patterns
        </h2>
        <div className="space-y-3">
          {replay.patterns.map((pattern: any, index: number) => (
            <div key={index} className="flex justify-between items-center p-3 bg-card border border-border rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xl">{pattern.type === 'FOMO' ? '🚀' : '📉'}</span>
                <span className="text-sm text-secondary">{pattern.type}</span>
              </div>
              <span className="bg-accent/20 text-accent text-xs px-2 py-0.5 rounded-full">
                {pattern.count} times
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* دکمه مشاهده گزارش کامل */}
      <button className="w-full py-3 bg-card border border-border rounded-xl text-secondary hover:bg-hover transition">
        View Full Report
      </button>
    </div>
  );
}
