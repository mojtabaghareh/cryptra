// ============================================================
// Markets.tsx (نسخه نهایی و پریمیوم - صفحه بازارها)
// ============================================================

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface Coin {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume: number;
  icon: string;
  color: string;
}

export default function Markets() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [coins, setCoins] = useState<Coin[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    // شبیه‌سازی داده‌های بازار
    const mockCoins: Coin[] = [
      { id: '1', symbol: 'BTC', name: 'Bitcoin', price: 68200, change24h: 2.4, marketCap: 1340000000000, volume: 30000000000, icon: '₿', color: '#F7931A' },
      { id: '2', symbol: 'ETH', name: 'Ethereum', price: 3450, change24h: 1.8, marketCap: 420000000000, volume: 15000000000, icon: '⟠', color: '#627EEA' },
      { id: '3', symbol: 'BNB', name: 'BNB', price: 590, change24h: 3.1, marketCap: 90000000000, volume: 5000000000, icon: '◆', color: '#F0B90B' },
      { id: '4', symbol: 'SOL', name: 'Solana', price: 150, change24h: 5.2, marketCap: 65000000000, volume: 3000000000, icon: '◎', color: '#9945FF' },
      { id: '5', symbol: 'TON', name: 'Toncoin', price: 5.2, change24h: -1.2, marketCap: 12000000000, volume: 400000000, icon: '💎', color: '#0088CC' },
    ];
    setCoins(mockCoins);
  }, []);

  const filteredCoins = coins.filter(coin => 
    coin.name.toLowerCase().includes(search.toLowerCase()) || 
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
            key={coin.id}
            onClick={() => navigate(`/coin/${coin.id}`)}
            className="glass-card flex items-center justify-between p-4 hover:bg-card-hover border-border-glass hover:border-accent transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ backgroundColor: `${coin.color}20`, color: coin.color }}
              >
                {coin.icon}
              </div>
              <div>
                <p className="font-medium text-primary text-sm">{coin.name}</p>
                <p className="text-xs text-secondary">{coin.symbol}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-primary text-sm">
                ${coin.price.toLocaleString()}
              </p>
              <p className={`text-xs font-medium ${coin.change24h >= 0 ? 'text-success' : 'text-danger'}`}>
                {coin.change24h >= 0 ? '▲' : '▼'} {Math.abs(coin.change24h)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
