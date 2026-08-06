// ============================================================
// Replay.tsx (نسخه نهایی و پریمیوم - صفحه گزارش هفتگی)
// ============================================================

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function Replay() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // داده‌های شبیه‌سازی شده
  const weekData = {
    weekNumber: 32,
    trades: [
      { id: 1, pair: 'ETH/USDT', type: 'Buy', entry: 3420, exit: 3480, holding: '4h', pnl: '+1.8%' },
      { id: 2, pair: 'BTC/USDT', type: 'Sell', entry: 68000, exit: 67500, holding: '2h', pnl: '-0.7%' },
      { id: 3, pair: 'SOL/USDT', type: 'Swap', entry: 148, exit: 152, holding: '6h', pnl: '+2.7%' },
    ],
  };

  return (
    <div className="container pb-4">
      {/* هدر پریمیوم */}
      <div className="flex items-center justify-between mb-6 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center shadow-lg shadow-accent-glow">
            <span className="text-lg">📅</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gradient">{t('Weekly Replay')}</h1>
        </div>
        <div className="glass px-3 py-1.5 rounded-lg border border-border-glass">
          <span className="text-xs text-secondary font-medium">Week {weekData.weekNumber}</span>
        </div>
      </div>

      {/* خلاصه هفته */}
      <div className="gradient-card mb-6 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-sm font-medium text-white/70">3 Trades</p>
          <div className="flex gap-6 mt-3">
            <div>
              <p className="text-success text-sm font-medium">▲ 2 Wins</p>
            </div>
            <div>
              <p className="text-danger text-sm font-medium">▼ 1 Loss</p>
            </div>
            <div>
              <p className="text-white text-sm font-medium">Win Rate 66%</p>
            </div>
          </div>
        </div>
      </div>

      {/* لیست معاملات */}
      <div className="space-y-3">
        {weekData.trades.map((trade) => (
          <div
            key={trade.id}
            className="glass-card p-4 border-border-glass hover:border-accent transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  trade.type === 'Buy' ? 'bg-success/20 text-success' : 
                  trade.type === 'Sell' ? 'bg-danger/20 text-danger' : 
                  'bg-accent/20 text-accent'
                }`}>
                  {trade.type}
                </span>
                <span className="text-sm font-medium text-primary">{trade.pair}</span>
              </div>
              <span className={`text-sm font-medium ${trade.pnl.startsWith('+') ? 'text-success' : 'text-danger'}`}>
                {trade.pnl}
              </span>
            </div>
            <div className="flex justify-between text-xs text-secondary">
              <span>Entry: ${trade.entry}</span>
              <span>Exit: ${trade.exit}</span>
              <span>Holding: {trade.holding}</span>
            </div>
          </div>
        ))}
      </div>

      {/* دکمه بازگشت */}
      <button
        onClick={() => navigate('/reflection')}
        className="w-full mt-6 py-4 glass border border-border-glass rounded-xl text-secondary hover:text-primary hover:border-accent transition-all duration-300"
      >
        ← {t('Back to Reflection')}
      </button>
    </div>
  );
}
