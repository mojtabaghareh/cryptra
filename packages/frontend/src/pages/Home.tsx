// ============================================================
// Home.tsx — نسخه نهایی و پرمیوم
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MainLayout from '../components/MainLayout';

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [portfolio] = useState({
    total: 24560.75,
    todayChange: 1850.25,
    todayPercent: 8.22,
    monthChange: -150,
    roi: 8.2,
  });

  const topMovers = [
    { symbol: 'BTC', name: 'Bitcoin', price: 62541.2, change: 4.25, icon: '₿' },
    { symbol: 'ETH', name: 'Ethereum', price: 3412.75, change: 3.1, icon: 'Ξ' },
    { symbol: 'SOL', name: 'Solana', price: 145.25, change: 6.15, icon: '◎' },
    { symbol: 'TON', name: 'TON', price: 6.25, change: 2.45, icon: '💎' },
    { symbol: 'LINK', name: 'Chainlink', price: 13.62, change: 3.85, icon: '⬡' },
  ];

  const recentTx = [
    { type: 'Swap', pair: 'ETH → USDC', amount: '+1,250.75 USDC', time: '2 mins ago', color: 'text-success' },
    { type: 'Buy', pair: 'Bitcoin', amount: '+0.025 BTC', time: '15 mins ago', color: 'text-success' },
    { type: 'Send', pair: 'To 0x7b3...9f2', amount: '-0.5 ETH', time: '1 hour ago', color: 'text-danger' },
    { type: 'Receive', pair: 'From 0x8a2...3d1', amount: '+2.3 SOL', time: '3 hours ago', color: 'text-success' },
  ];

  const allocation = [
    { name: 'Bitcoin', percent: 42, color: '#F7931A' },
    { name: 'Ethereum', percent: 30, color: '#627EEA' },
    { name: 'Solana', percent: 18, color: '#9945FF' },
    { name: 'TON', percent: 10, color: '#0088CC' },
  ];

  return (
    <MainLayout title="Cryptra">
      {/* Portfolio Overview */}
      <div className="gradient-card mb-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-sm text-white/70 font-medium">Total Portfolio</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mt-1 tracking-tight">
                ${portfolio.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="glass px-3 py-1.5 rounded-full border border-white/20">
              <span className="text-xs font-semibold text-white">+24h</span>
            </div>
          </div>

          <div className="flex gap-5 mt-4">
            <div>
              <p className="text-sm font-semibold text-white">
                ▲ ${portfolio.todayChange.toLocaleString()}
              </p>
              <p className="text-xs text-white/60">Today</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {portfolio.monthChange >= 0 ? '▲' : '▼'} ${Math.abs(portfolio.monthChange)}
              </p>
              <p className="text-xs text-white/60">30d</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                ▲ {portfolio.roi}%
              </p>
              <p className="text-xs text-white/60">ROI</p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Reflection */}
      <div className="glass-card mb-5">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm">
              🪞
            </div>
            <h3 className="text-sm font-semibold">Weekly Reflection</h3>
          </div>
          <span className="text-[11px] text-secondary glass px-2.5 py-1 rounded-full">
            Week 32
          </span>
        </div>

        <div className="space-y-2.5 mb-4">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5">
            <span className="text-warning text-sm mt-0.5">⚠️</span>
            <p className="text-sm text-secondary leading-relaxed">
              این هفته ۲ بار در زمان افزایش قیمت خرید کرده‌اید.
            </p>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5">
            <span className="text-success text-sm mt-0.5">✅</span>
            <p className="text-sm text-secondary leading-relaxed">
              این هفته نسبت به هفته قبل صبورتر بوده‌اید.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/reflection')}
          className="w-full btn-outline text-sm flex items-center justify-center gap-2 py-3"
        >
          View Full Analysis
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Buy', icon: '↑', color: 'text-accent', path: '/trade' },
          { label: 'Sell', icon: '↓', color: 'text-danger', path: '/trade' },
          { label: 'Swap', icon: '↔', color: 'text-success', path: '/trade' },
          { label: 'Send', icon: '→', color: 'text-warning', path: '/wallet' },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="glass-card flex flex-col items-center justify-center py-4 px-2 hover:border-accent transition-all duration-300 active:scale-95"
          >
            <span className={`text-xl mb-1.5 ${action.color}`}>{action.icon}</span>
            <span className="text-[11px] font-medium text-secondary">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Top Movers */}
      <div className="glass-card mb-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold">Top Movers</h3>
          <button
            onClick={() => navigate('/markets')}
            className="text-xs text-accent font-medium"
          >
            View All →
          </button>
        </div>

        <div className="space-y-3">
          {topMovers.map((coin) => (
            <div
              key={coin.symbol}
              className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-sm">
                  {coin.icon}
                </div>
                <div>
                  <p className="text-sm font-medium">{coin.symbol}</p>
                  <p className="text-[11px] text-muted">{coin.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  ${coin.price.toLocaleString()}
                </p>
                <p className={`text-xs font-medium ${coin.change >= 0 ? 'text-success' : 'text-danger'}`}>
                  {coin.change >= 0 ? '+' : ''}{coin.change}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card mb-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold">Recent Transactions</h3>
          <button className="text-xs text-accent font-medium">View All</button>
        </div>

        <div className="space-y-3">
          {recentTx.map((tx, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-xs font-medium text-secondary">
                  {tx.type[0]}
                </div>
                <div>
                  <p className="text-sm font-medium">{tx.type}</p>
                  <p className="text-[11px] text-muted">{tx.pair}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${tx.color}`}>{tx.amount}</p>
                <p className="text-[11px] text-muted">{tx.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Portfolio Allocation */}
      <div className="glass-card mb-5">
        <h3 className="text-sm font-semibold mb-4">Portfolio Allocation</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F7931A" strokeWidth="3.5" strokeDasharray="42 100" strokeDashoffset="0" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#627EEA" strokeWidth="3.5" strokeDasharray="30 100" strokeDashoffset="-42" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#9945FF" strokeWidth="3.5" strokeDasharray="18 100" strokeDashoffset="-72" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#0088CC" strokeWidth="3.5" strokeDasharray="10 100" strokeDashoffset="-90" />
            </svg>
          </div>
          <div className="flex-1 space-y-2">
            {allocation.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-secondary">{item.name}</span>
                </div>
                <span className="font-medium">{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Sentiment */}
      <div className="glass-card mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold">Market Sentiment</h3>
          <span className="text-xs font-medium text-warning">Greed</span>
        </div>
        <div className="relative h-3 rounded-full bg-white/10 overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{
              width: '72%',
              background: 'linear-gradient(90deg, #FF5A5A, #FFB84C, #00D2A0)',
            }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[11px] text-muted">
          <span>Fear</span>
          <span className="font-medium text-primary">72</span>
          <span>Greed</span>
        </div>
      </div>
    </MainLayout>
  );
}