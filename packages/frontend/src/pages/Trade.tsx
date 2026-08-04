// ============================================================
// Trade.tsx
// صفحه معامله (Swap, Perp و Reflection Pre-Check)
// ============================================================

import React, { useState } from 'react';

export default function Trade() {
  const [amount, setAmount] = useState('');
  const [fromToken, setFromToken] = useState('USDT');
  const [toToken, setToToken] = useState('ETH');
  const [isSwap, setIsSwap] = useState(true);
  const [showWarning, setShowWarning] = useState(false);

  const handleTrade = () => {
    // شبیه‌سازی بررسی رفتار قبل از معامله
    setShowWarning(true);
  };

  return (
    <div className="p-4">
      {/* هدر صفحه */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>⚡</span> Trade
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setIsSwap(true)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              isSwap ? 'bg-accent text-white' : 'bg-card text-secondary hover:bg-hover'
            }`}
          >
            Swap
          </button>
          <button
            onClick={() => setIsSwap(false)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              !isSwap ? 'bg-accent text-white' : 'bg-card text-secondary hover:bg-hover'
            }`}
          >
            Advanced
          </button>
        </div>
      </div>

      {/* فرم معامله */}
      <div className="card border-border mb-4">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex flex-col w-full">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-secondary">From</span>
              <span className="text-xs text-muted">Balance: 2,450 USDT</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-transparent text-xl font-medium w-full outline-none"
              />
              <select
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value)}
                className="bg-card border border-border rounded-lg px-3 py-1 text-sm outline-none text-secondary"
              >
                <option value="USDT">USDT</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm text-secondary">To</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={amount ? (parseFloat(amount) * 3450).toFixed(2) : '0.00'}
              disabled
              className="bg-transparent text-xl font-medium w-full outline-none text-muted"
            />
            <select
              value={toToken}
              onChange={(e) => setToToken(e.target.value)}
              className="bg-card border border-border rounded-lg px-3 py-1 text-sm outline-none text-secondary"
            >
              <option value="ETH">ETH</option>
              <option value="BTC">BTC</option>
            </select>
          </div>
        </div>
      </div>

      {/* جزئیات معامله */}
      <div className="card border-border mb-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-secondary">Rate</span>
          <span className="text-primary">1 ETH ≈ 3,450 USDT</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-secondary">Network Fee</span>
          <span className="text-primary">~$0.50</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-secondary">Slippage</span>
          <span className="text-primary">0.5%</span>
        </div>
      </div>

      {/* دکمه‌ی اصلی معامله */}
      <button
        onClick={handleTrade}
        className="w-full py-4 bg-accent text-white text-lg font-bold rounded-xl hover:opacity-90 transition"
      >
        {isSwap ? 'Swap' : 'Buy'}
      </button>

      {/* هشدار بازتاب (Reflection Warning) */}
      {showWarning && (
        <div className="mt-4 p-4 bg-warning/10 border border-warning/30 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-xl">🪞</span>
            <div>
              <h3 className="text-warning font-medium">Reflection</h3>
              <p className="text-sm text-secondary mt-1">
                شما در ۳ معامله اخیر خود، در زمان افزایش قیمت خرید کرده‌اید. 
                این ممکن است نشانه‌ی FOMO باشد. مطمئن هستید؟
              </p>
              <div className="flex gap-3 mt-3">
                <button className="px-4 py-1.5 bg-accent text-white rounded-lg text-sm">
                  Continue
                </button>
                <button
                  onClick={() => setShowWarning(false)}
                  className="px-4 py-1.5 bg-card border border-border rounded-lg text-sm text-secondary"
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
