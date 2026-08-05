// ============================================================
// Portfolio.tsx (نسخه‌ی نهایی - پریمیوم با Glassmorphism)
// ============================================================

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Asset {
  symbol: string;
  name: string;
  balance: number;
  valueUsd: number;
  change24h: number;
  icon: string;
  color: string;
}

export default function Portfolio() {
  const { t } = useTranslation();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      const mockAssets: Asset[] = [
        { symbol: 'ETH', name: 'Ethereum', balance: 2.5, valueUsd: 8625, change24h: 1.8, icon: '⟠', color: '#627EEA' },
        { symbol: 'BTC', name: 'Bitcoin', balance: 0.15, valueUsd: 10200, change24h: 2.4, icon: '₿', color: '#F7931A' },
        { symbol: 'USDT', name: 'Tether', balance: 1450, valueUsd: 1450, change24h: 0.0, icon: '💵', color: '#26A17B' },
        { symbol: 'SOL', name: 'Solana', balance: 45, valueUsd: 6750, change24h: -1.2, icon: '◎', color: '#9945FF' },
      ];
      setAssets(mockAssets);
      setTotalValue(mockAssets.reduce((sum, a) => sum + a.valueUsd, 0));
      setLoading(false);
    }, 600);
  }, []);

  if (loading) {
    return (
      <div className="container flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full glass flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-3xl">💼</span>
          </div>
          <p className="text-secondary">{t('Loading portfolio...')}</p>
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
            <span className="text-lg">💼</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gradient">{t('Portfolio')}</h1>
        </div>
        <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-lg border border-border-glass">
          <span className="text-sm font-medium text-primary">
            ${totalValue.toLocaleString()}
          </span>
          <span className="text-xs text-secondary">USD</span>
        </div>
      </div>

      {/* خلاصه پورتفولیو */}
      <div className="glass-card mb-6 p-5">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-secondary uppercase tracking-wider font-medium">{t('Total Value')}</p>
            <p className="text-3xl font-bold text-primary mt-1">
              ${totalValue.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-success text-sm">▲ 12.4%</span>
              <span className="text-xs text-secondary">24h</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent-glow/20 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-accent" />
            </div>
          </div>
        </div>
      </div>

      {/* لیست دارایی‌ها */}
      <div className="space-y-3">
        {assets.map((asset, index) => (
          <div
            key={index}
            className="glass-card flex items-center justify-between p-4 hover:bg-card-hover border-border-glass hover:border-accent transition-all duration-300 group"
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ backgroundColor: `${asset.color}20`, color: asset.color }}
              >
                {asset.icon}
              </div>
              <div>
                <p className="font-medium text-primary text-sm">{asset.name}</p>
                <p className="text-xs text-secondary">{asset.symbol}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-primary text-sm">
                ${asset.valueUsd.toLocaleString()}
              </p>
              <div className="flex items-center justify-end gap-2 mt-0.5">
                <span className={`text-xs font-medium flex items-center gap-1 ${
                  asset.change24h >= 0 ? 'text-success' : 'text-danger'
                }`}>
                  <span className={`text-[10px] ${asset.change24h >= 0 ? 'text-success' : 'text-danger'}`}>
                    {asset.change24h >= 0 ? '▲' : '▼'}
                  </span>
                  {Math.abs(asset.change24h).toFixed(1)}%
                </span>
                <span className="text-xs text-muted">
                  {asset.balance} {asset.symbol}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}