// ============================================================
// Portfolio.tsx
// صفحه نمایش دارایی‌ها و پورتفولیوی کاربر
// ============================================================

import React, { useState, useEffect } from 'react';

interface Asset {
  symbol: string;
  name: string;
  balance: number;
  valueUsd: number;
  change24h: number;
  icon: string;
}

export default function Portfolio() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // شبیه‌سازی دریافت داده‌های پورتفولیو
    setTimeout(() => {
      const mockAssets: Asset[] = [
        { symbol: 'ETH', name: 'Ethereum', balance: 2.5, valueUsd: 8625, change24h: 1.8, icon: '⟠' },
        { symbol: 'BTC', name: 'Bitcoin', balance: 0.15, valueUsd: 10200, change24h: 2.4, icon: '₿' },
        { symbol: 'USDT', name: 'Tether', balance: 1450, valueUsd: 1450, change24h: 0.0, icon: '💵' },
        { symbol: 'SOL', name: 'Solana', balance: 45, valueUsd: 6750, change24h: -1.2, icon: '◎' },
      ];
      setAssets(mockAssets);
      setTotalValue(mockAssets.reduce((sum, a) => sum + a.valueUsd, 0));
      setLoading(false);
    }, 600);
  }, []);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl animate-pulse mb-2">💼</div>
          <p className="text-secondary">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* هدر صفحه */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-3xl">💼</span>
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <span className="ml-auto text-2xl font-bold text-primary">
          ${totalValue.toLocaleString()}
        </span>
      </div>

      {/* لیست دارایی‌ها */}
      <div className="space-y-3">
        {assets.map((asset, index) => (
          <div key={index} className="card border-border flex items-center justify-between p-4 hover:bg-hover transition">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{asset.icon}</span>
              <div>
                <p className="font-medium text-primary">{asset.name}</p>
                <p className="text-xs text-secondary">{asset.symbol}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-primary">
                ${asset.valueUsd.toLocaleString()}
              </p>
              <p className="text-xs font-medium flex items-center justify-end gap-1">
                <span className={asset.change24h >= 0 ? 'text-success' : 'text-danger'}>
                  {asset.change24h >= 0 ? '▲' : '▼'} {Math.abs(asset.change24h)}%
                </span>
                <span className="text-xs text-secondary ml-2">
                  {asset.balance} {asset.symbol}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
