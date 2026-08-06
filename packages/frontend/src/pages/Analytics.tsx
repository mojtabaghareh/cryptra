// ============================================================
// Analytics.tsx (نسخه نهایی و پریمیوم - صفحه تحلیل)
// ============================================================

import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Analytics() {
  const { t } = useTranslation();

  return (
    <div className="container pb-4">
      {/* هدر پریمیوم */}
      <div className="flex items-center justify-between mb-6 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center shadow-lg shadow-accent-glow">
            <span className="text-lg">📈</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gradient">{t('Analytics')}</h1>
        </div>
      </div>

      {/* کارت‌های آماری */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-secondary">Win Rate</p>
          <p className="text-xl font-bold text-success mt-1">68%</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-secondary">Avg Hold</p>
          <p className="text-xl font-bold text-accent mt-1">4.2h</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-secondary">Best Time</p>
          <p className="text-xl font-bold text-primary mt-1">10 AM</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-secondary">ROI</p>
          <p className="text-xl font-bold text-success mt-1">+12.4%</p>
        </div>
      </div>

      {/* نمودار ساده (با CSS) */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold text-primary mb-3">Performance</h3>
        <div className="h-32 flex items-end gap-2 justify-between">
          {[40, 55, 45, 70, 60, 85, 75].map((h, i) => (
            <div key={i} className="flex-1 bg-gradient-to-t from-accent/50 to-accent rounded-t-sm hover:from-accent/70 hover:to-accent-glow transition-all" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
