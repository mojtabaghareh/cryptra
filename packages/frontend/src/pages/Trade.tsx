// ============================================================
// Trade.tsx (نسخه‌ی نهایی - پریمیوم با Reflection Pre-Check)
// ============================================================

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Trade() {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [fromToken, setFromToken] = useState('USDT');
  const [toToken, setToToken] = useState('ETH');
  const [isSwap, setIsSwap] = useState(true);
  const [showWarning, setShowWarning] = useState(false);

  const handleTrade = () => {
    setShowWarning(true);
  };

  return (
    <div className="container pb-4">
      {/* هدر پریمیوم */}
      <div className="flex items-center justify-between mb-6 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center shadow-lg shadow-accent-glow">
            <span className="text-lg">⚡</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gradient">{t('Trade')}</h1>
        </div>
        <div className="flex gap-1 glass px-1 py-1 rounded-xl">
          <button
            onClick={() => setIsSwap(true)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
              isSwap 
                ? 'bg-accent text-white shadow-md shadow-accent-glow' 
                : 'text-secondary hover:text-primary'
            }`}
          >
            Swap
          </button>
          <button
            onClick={() => setIsSwap(false)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
              !isSwap 
                ? 'bg-accent text-white shadow-md shadow-accent-glow' 
                : 'text-secondary hover:text-primary'
            }`}
          >
            Advanced
          </button>
        </div>
      </div>

      {/* فرم معامله شیشه‌ای */}
      <div className="glass-card mb-4">
        <div className="p-4 border-b border-border-glass">
          <div className="flex flex-col w-full">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-secondary font-medium">{t('From')}</span>
              <span className="text-xs text-muted">Balance: 2,450 USDT</span>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-transparent text-2xl font-semibold w-full outline-none text-primary"
              />
              <div className="relative">
                <select
                  value={fromToken}
                  onChange={(e) => setFromToken(e.target.value)}
                  className="glass px-3 py-1.5 rounded-lg text-sm outline-none text-secondary font-medium appearance-none cursor-pointer pr-8 border border-border-glass hover:border-accent transition-colors"
                >
                  <option value="USDT">USDT</option>
                  <option value="USDC">USDC</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-secondary font-medium">{t('To')}</span>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={amount ? (parseFloat(amount) * 3450).toFixed(2) : '0.00'}
              disabled
              className="bg-transparent text-2xl font-semibold w-full outline-none text-muted"
            />
            <div className="relative">
              <select
                value={toToken}
                onChange={(e) => setToToken(e.target.value)}
                className="glass px-3 py-1.5 rounded-lg text-sm outline-none text-secondary font-medium appearance-none cursor-pointer pr-8 border border-border-glass hover:border-accent transition-colors"
              >
                <option value="ETH">ETH</option>
                <option value="BTC">BTC</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <button className="w-full glass py-2 rounded-lg flex items-center justify-center gap-2 border border-border-glass hover:border-accent transition-colors">
            <span className="text-secondary text-sm">Route via 1inch</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 9l-6 6 6 6" />
              <path d="M14 9l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* جزئیات معامله */}
      <div className="glass-card mb-6 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-secondary">{t('Rate')}</span>
          <span className="text-primary font-medium">1 ETH ≈ 3,450 USDT</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-secondary">{t('Network Fee')}</span>
          <span className="text-primary font-medium">~$0.50</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-secondary">{t('Slippage')}</span>
          <span className="text-primary font-medium">0.5%</span>
        </div>
        <div className="flex justify-between text-sm pt-3 border-t border-border-glass">
          <span className="text-secondary font-medium">{t('Est. Output')}</span>
          <span className="text-primary font-semibold text-accent">
            {amount ? (parseFloat(amount) * 3450).toFixed(2) : '0.00'} USDT
          </span>
        </div>
      </div>

      {/* دکمه‌ی اصلی معامله */}
      <button
        onClick={handleTrade}
        className="w-full py-4 bg-gradient-to-r from-accent to-accent-glow text-white text-lg font-bold rounded-xl shadow-lg shadow-accent-glow hover:shadow-xl hover:shadow-accent-glow/50 transition-all duration-300 transform hover:-translate-y-0.5"
      >
        {isSwap ? t('Swap') : t('Buy')}
      </button>

      {/* هشدار بازتاب پریمیوم */}
      {showWarning && (
        <div className="mt-4 glass-card border border-warning/30 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🪞</span>
            </div>
            <div className="flex-1">
              <h3 className="text-warning font-semibold mb-1">Reflection</h3>
              <p className="text-sm text-secondary leading-relaxed">
                شما در ۳ معامله اخیر خود، در زمان افزایش قیمت خرید کرده‌اید. 
                این ممکن است نشانه‌ی FOMO باشد. مطمئن هستید؟
              </p>
              <div className="flex gap-3 mt-4">
                <button className="px-5 py-2 bg-gradient-to-r from-accent to-accent-glow text-white rounded-lg text-sm font-medium shadow-sm shadow-accent-glow">
                  Continue
                </button>
                <button
                  onClick={() => setShowWarning(false)}
                  className="px-5 py-2 glass border border-border-glass rounded-lg text-sm font-medium text-secondary hover:text-primary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}