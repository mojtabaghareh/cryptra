// ============================================================
// Persona.tsx (نسخه نهایی و پریمیوم - صفحه شخصیت مالی)
// ============================================================

import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Persona() {
  const { t } = useTranslation();

  return (
    <div className="container pb-4">
      {/* هدر پریمیوم */}
      <div className="flex items-center justify-between mb-6 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center shadow-lg shadow-accent-glow">
            <span className="text-lg">🧠</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gradient">{t('Financial Persona')}</h1>
        </div>
      </div>

      {/* کارت شخصیت */}
      <div className="gradient-card mb-6 relative overflow-hidden text-center py-8">
        <div className="relative z-10">
          <div className="w-24 h-24 rounded-full bg-white/10 mx-auto mb-4 flex items-center justify-center text-4xl">
            🦉
          </div>
          <h2 className="text-2xl font-bold text-white">The Strategist</h2>
          <p className="text-sm text-white/70 mt-1">Patient • Analytical • Risk-Aware</p>
        </div>
      </div>

      {/* آماری */}
      <div className="space-y-4">
        <div className="glass-card p-4">
          <div className="flex justify-between text-sm">
            <span className="text-secondary">Risk Tolerance</span>
            <span className="text-primary font-medium">Moderate</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full mt-2">
            <div className="h-full bg-gradient-to-r from-success to-warning rounded-full" style={{ width: '65%' }} />
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex justify-between text-sm">
            <span className="text-secondary">Holding Discipline</span>
            <span className="text-primary font-medium">Good</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full mt-2">
            <div className="h-full bg-accent rounded-full" style={{ width: '75%' }} />
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex justify-between text-sm">
            <span className="text-secondary">Emotional Trading</span>
            <span className="text-primary font-medium">Low</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full mt-2">
            <div className="h-full bg-success rounded-full" style={{ width: '20%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
