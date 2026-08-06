// ============================================================
// TopMovers.tsx - Real-Time Binance Integration
// ============================================================

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BinanceService, BinancePrice } from '../services';

export default function TopMovers() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [prices, setPrices] = useState<BinancePrice[]>([]);

  useEffect(() => {
    const service = BinanceService.getInstance();
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'LINKUSDT'];

    // اتصال به بایننس
    service.connect(symbols);

    // دریافت به‌روزرسانی‌ها
    const unsubscribe = service.subscribe((newPrices) => {
      setPrices(newPrices);
    });

    return () => {
      unsubscribe();
      service.disconnect();
    };
  }, []);

  // دریافت آیکون و رنگ
  const getCoinIcon = (symbol: string) => {
    const icons: Record<string, string> = {
      'BTC': '₿', 'ETH': '⟠', 'SOL': '◎', 'BNB': '◆', 'LINK': '🔗'
    };
    return icons[symbol] || '🪙';
  };

  const getCoinColor = (symbol: string) => {
    const colors: Record<string, string> = {
      'BTC': '#F7931A', 'ETH': '#627EEA', 'SOL': '#9945FF', 'BNB': '#F0B90B', 'LINK': '#2A5ADA'
    };
    return colors[symbol] || '#4A90D9';
  };

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
          <span className="text-[10px] text-secondary">Binance</span>
        </div>
      </div>

      <div className="space-y-3">
        {prices.map((coin) => (
          <div key={coin.symbol} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: `${getCoinColor(coin.symbol)}20`, color: getCoinColor(coin.symbol) }}>
                {getCoinIcon(coin.symbol)}
              </div>
              <div>
                <p className="text-sm font-medium text-primary">{coin.symbol}</p>
                <p className="text-xs text-secondary">${coin.price.toFixed(2)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium ${coin.change24h >= 0 ? 'text-success' : 'text-danger'}`}>
                {coin.change24h >= 0 ? '▲' : '▼'} {Math.abs(coin.change24h).toFixed(2)}%
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