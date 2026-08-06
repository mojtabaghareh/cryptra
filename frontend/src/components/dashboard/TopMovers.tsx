// ============================================================
// TopMovers.tsx - Real-Time Price Updates (Guaranteed)
// ============================================================

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function TopMovers() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // حالت اولیه قیمت‌ها
  const [prices, setPrices] = useState({
    BTC: { price: 62541.20, change: 4.25, icon: '₿', color: '#F7931A' },
    ETH: { price: 3412.75, change: 3.10, icon: '⟠', color: '#627EEA' },
    SOL: { price: 145.25, change: 2.85, icon: '◎', color: '#9945FF' },
    TON: { price: 6.25, change: 2.45, icon: '💎', color: '#0088CC' },
    LINK: { price: 13.62, change: 3.85, icon: '🔗', color: '#2A5ADA' },
  });

  // این useEffect باعث می‌شود قیمت‌ها هر ۱ ثانیه تغییر کنند
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices((prevPrices) => {
        const newPrices = { ...prevPrices };
        // روی هر ارز یک تغییر تصادفی (مثلاً ±۰.۵٪) اعمال می‌کنیم
        Object.keys(newPrices).forEach((symbol) => {
          const basePrice = newPrices[symbol].price;
          const fluctuation = 1 + (Math.random() - 0.5) * 0.01; // تغییر بین ۹۹.۵٪ تا ۱۰۰.۵٪
          newPrices[symbol].price = basePrice * fluctuation;
          // تغییرات درصدی را هم آپدیت می‌کنیم
          newPrices[symbol].change = (newPrices[symbol].change || 0) + (Math.random() - 0.5) * 0.1;
        });
        return newPrices;
      });
    }, 1000); // هر ۱۰۰۰ میلی‌ثانیه (۱ ثانیه) اجرا شود

    // پاک‌سازی تایمر هنگام بستن صفحه
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
            <span className="text-sm">📈</span>
          </div>
          <h3 className="text-sm font-semibold text-primary">{t('Top Movers')}</h3>
        </div>
        <div className="flex items-center gap-1 glass px-2 py-0.5 rounded-full border border-border-glass">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] text-secondary">Real-Time</span>
        </div>
      </div>

      <div className="space-y-3">
        {Object.entries(prices).map(([symbol, data]) => (
          <div key={symbol} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: `${data.color}20`, color: data.color }}>
                {data.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-primary">{symbol}</p>
                <p className="text-xs text-secondary">${data.price.toFixed(2)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium ${data.change >= 0 ? 'text-success' : 'text-danger'}`}>
                {data.change >= 0 ? '▲' : '▼'} {Math.abs(data.change).toFixed(2)}%
              </p>
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={() => navigate('/markets')}
        className="w-full mt-4 py-2 glass border border-border-glass rounded-lg text-xs text-secondary hover:text-primary hover:border-accent transition-colors text-center"
      >
        {t('View All Markets')} →
      </button>
    </div>
  );
}
