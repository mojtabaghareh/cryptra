// ============================================================
// Replay.tsx (نسخه نهایی اصلاح‌شده و یکپارچه)
// ============================================================

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { TradeHistoryService, Trade } from '../../services/index.ts';

export default function Replay() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const weekNumber = 32;

  useEffect(() => {
    const service = TradeHistoryService.getInstance();
    service.getUserTrades('user-123', weekNumber).then((data) => {
      setTrades(data);
      setLoading(false);
    });
  }, []);

  // محاسبه آمار
  const totalTrades = trades.length;
  const wins = trades.filter(t => t.pnl.startsWith('+')).length;
  const losses = totalTrades - wins;
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;

  if (loading) {
    return (
      <div className="container flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl animate-pulse mb-2">📅</div>
          <p className="text-secondary">{t('Loading trades...')}</p>
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
            <span className="text-lg">📅</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gradient">{t('Weekly Replay')}</h1>
        </div>
        <div className="glass px-3 py-1.5 rounded-lg border border-border-glass">
          <span className="text-xs text-secondary font-medium">{t('Week')} {weekNumber}</span>
        </div>
      </div>

      {/* خلاصه هفته */}
      <div className="gradient-card mb-6 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-sm font-medium text-white/70">{totalTrades} {t('Trades')}</p>
          <div className="flex gap-6 mt-3">
            <div>
              <p className="text-success text-sm font-medium">▲ {wins} {t('Wins')}</p>
            </div>
            <div>
              <p className="text-danger text-sm font-medium">▼ {losses} {t('Losses')}</p>
            </div>
            <div>
              <p className="text-white text-sm font-medium">{t('Win Rate')} {winRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* لیست معاملات */}
      <div className="space-y-3">
        {trades.map((trade) => (
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
              <span>{t('Entry')}: ${trade.entry}</span>
              <span>{t('Exit')}: ${trade.exit}</span>
              <span>{t('Holding')}: {trade.holding}</span>
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