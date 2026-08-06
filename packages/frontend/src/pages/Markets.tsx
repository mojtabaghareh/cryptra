// ============================================================
// Markets.tsx (نسخه نهایی اصلاح‌شده - بدون خطا)
// ============================================================

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BinanceService, BinancePrice } from '../../services/index.js';

export default function Markets() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [prices, setPrices] = useState<BinancePrice[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  // اتصال به بایننس برای دریافت قیمت‌های لحظه‌ای
  useEffect(() => {
    const service = BinanceService.getInstance();
    const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'TONUSDT'];

    service.connect(symbols);

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
      'BTC': '₿', 'ETH': '⟠', 'BNB': '◆', 'SOL': '◎', 'TON': '💎'
    };
    return icons[symbol] || '🪙';
  };

  const getCoinColor = (symbol: string) => {
    const colors: Record<string, string> = {
      'BTC': '#F7931A', 'ETH': '#627EEA', 'BNB': '#F0B90B', 'SOL': '#9945FF', 'TON': '#0088CC'
    };
    return colors[symbol] || '#4A90D9';
  };

  const filteredCoins = prices.filter(coin => 
    coin.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const categories = ['All', 'Trending', 'DeFi', 'AI', 'Meme', 'Layer1', 'Layer2'];

  return (
    <div className="container pb-4">
      {/* هدر پریمیوم */}
      <div className="flex items-center justify-between mb-6 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center shadow-lg shadow-accent-glow">
            <span className="text-lg">📊</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gradient">{t('Markets')}</h1>
        </div>
      </div>

      {/* جستجو */}
      <div className="glass-card mb-4 p-3">
        <div className="relative">
          <input
            type="text"
            placeholder={t('Search coins...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-primary text-sm outline-none pl-2 pr-8"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary">🔍</span>
        </div>
      </div>

      {/* دسته‌بندی‌ها */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 ${
              category === cat
                ? 'bg-accent text-white shadow-md shadow-accent-glow'
                : 'glass text-secondary hover:text-primary border border-border-glass'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* لیست ارزها */}
      <div className="space-y-3">
        {filteredCoins.map((coin) => (
          <div
            key={coin.symbol}
            className="glass-card flex items-center justify-between p-4 hover:bg-card-hover border-border-glass hover:border-accent transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ backgroundColor: `${getCoinColor(coin.symbol)}20`, color: getCoinColor(coin.symbol) }}
              >
                {getCoinIcon(coin.symbol)}
              </div>
              <div>
                <p className="font-medium text-primary text-sm">{coin.symbol}</p>
                <p className="text-xs text-secondary">{coin.symbol}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-primary text-sm">
                ${coin.price.toFixed(2)}
              </p>
              <p className={`text-xs font-medium ${coin.change24h >= 0 ? 'text-success' : 'text-danger'}`}>
                {coin.change24h >= 0 ? '▲' : '▼'} {Math.abs(coin.change24h).toFixed(2)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}