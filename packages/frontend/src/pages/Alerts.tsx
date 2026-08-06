// ============================================================
// Alerts.tsx (نسخه نهایی و پریمیوم - صفحه هشدارها)
// ============================================================

import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Alerts() {
  const { t } = useTranslation();

  const alerts = [
    { id: 1, type: 'price', message: 'BTC broke $68,000', time: '2m ago' },
    { id: 2, type: 'reflection', message: 'FOMO pattern detected', time: '1h ago' },
    { id: 3, type: 'portfolio', message: 'Portfolio +5% today', time: '4h ago' },
  ];

  return (
    <div className="container pb-4">
      {/* هدر پریمیوم */}
      <div className="flex items-center justify-between mb-6 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center shadow-lg shadow-accent-glow">
            <span className="text-lg">🔔</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gradient">{t('Alerts')}</h1>
        </div>
        <div className="glass px-3 py-1.5 rounded-lg border border-border-glass">
          <span className="text-xs text-secondary font-medium">{alerts.length} new</span>
        </div>
      </div>

      {/* لیست هشدارها */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="glass-card p-4 border-border-glass hover:border-accent transition-all duration-300"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <span className={`text-sm ${
                  alert.type === 'price' ? 'text-accent' :
                  alert.type === 'reflection' ? 'text-warning' : 'text-success'
                }`}>
                  {alert.type === 'price' ? '📈' : alert.type === 'reflection' ? '🪞' : '💼'}
                </span>
                <span className="text-sm text-primary">{alert.message}</span>
              </div>
              <span className="text-xs text-secondary">{alert.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
