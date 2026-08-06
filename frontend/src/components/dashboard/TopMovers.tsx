// ============================================================
// TopMovers.tsx - Top Movers List
// ============================================================

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function TopMovers() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const movers = [
    { symbol: 'BTC', name: 'Bitcoin', price: 62541.20, change: 4.25, color: '#F7931A', icon: '₿' },
    { symbol: 'ETH', name: 'Ethereum', price: 3412.75, change: 3.10, color: '#627EEA', icon: '⟠' },
    { symbol: 'SOL', name: 'Solana', price: 145.25, change: 2.85, color: '#9945FF', icon: '◎' },
    { symbol: 'TON', name: 'TON', price: 6.25, change: 2.45, color: '#0088CC', icon: '💎' },
    { symbol: 'LINK', name: 'Chainlink', price: 13.62, change: 3.85, color: '#2A5ADA', icon: '🔗' },
  ];

  return (
    <div className="glass-card h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
            <span className="text-sm">📈</span>
          </div>
          <h3 className="text-sm font-semibold text-primary">{t('Top Movers')}</h3>
        </div>
        <span className="text-xs text-secondary">24H</span>
      </div>

      <div className="space-y-3">
        {movers.map((coin) => (
          <div key={coin.symbol} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: `${coin.color}20`, color: coin.color }}>
                {coin.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-primary">{coin.name}</p>
                <p className="text-xs text-secondary">{coin.symbol}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-primary">${coin.price.toLocaleString()}</p>
              <p className={`text-xs font-medium ${coin.change >= 0 ? 'text-success' : 'text-danger'}`}>
                {coin.change >= 0 ? '▲' : '▼'} {coin.change}%
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
