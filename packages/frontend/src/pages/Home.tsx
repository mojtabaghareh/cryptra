// ============================================================
// Home.tsx (نسخه‌ی نهایی با طراحی جدید)
// ============================================================

import React, { useState, useEffect } from 'react';

export default function Home() {
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
    <div className="p-4">
      {/* هدر */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🔷</span>
          <h1 className="text-2xl font-bold">Cryptra</h1>
        </div>
        <div className="flex gap-3">
          <button className="btn-icon">🔔</button>
          <button className="btn-icon">⚙️</button>
        </div>
      </div>

      {/* کارت پورتفولیو (گرادینت) */}
      <div className="gradient-card mb-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-300 opacity-80">Total Portfolio</p>
            <p className="text-4xl font-bold mt-1 text-white">
              ${portfolio.total.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-medium ${portfolio.todayChange >= 0 ? 'text-success' : 'text-danger'}`}>
              {portfolio.todayChange >= 0 ? '▲' : '▼'} ${Math.abs(portfolio.todayChange).toLocaleString()}
            </p>
            <p className={`text-xs ${portfolio.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
              {portfolio.changePercent >= 0 ? '▲' : '▼'} {Math.abs(portfolio.changePercent).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* کارت بازتاب */}
      <div className="card mb-6 border-gray-700">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-secondary flex items-center gap-2">
            <span>🪞</span> Weekly Reflection
          </h2>
          <span className="text-xs text-muted">Week 32</span>
        </div>
        <ul className="space-y-2">
          {insights.map((insight, index) => (
            <li key={index} className="text-sm text-secondary flex gap-2 items-start">
              <span className="mt-0.5">•</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* دکمه‌های اقدام سریع */}
      <div className="grid grid-cols-4 gap-3">
        <button className="flex flex-col items-center p-3 bg-card rounded-xl hover:bg-hover border border-border transition">
          <span className="text-xl">↑</span>
          <span className="text-xs mt-1 text-secondary">Buy</span>
        </button>
        <button className="flex flex-col items-center p-3 bg-card rounded-xl hover:bg-hover border border-border transition">
          <span className="text-xl">↓</span>
          <span className="text-xs mt-1 text-secondary">Sell</span>
        </button>
        <button className="flex flex-col items-center p-3 bg-card rounded-xl hover:bg-hover border border-border transition">
          <span className="text-xl">↔</span>
          <span className="text-xs mt-1 text-secondary">Swap</span>
        </button>
        <button className="flex flex-col items-center p-3 bg-card rounded-xl hover:bg-hover border border-border transition">
          <span className="text-xl">→</span>
          <span className="text-xs mt-1 text-secondary">Send</span>
        </button>
      </div>
    </div>
  );
}
