// ============================================================
// PortfolioAllocation.tsx - Asset Allocation Chart
// ============================================================

import React from 'react';
import { useTranslation } from 'react-i18next';

export default function PortfolioAllocation() {
  const { t } = useTranslation();

  const assets = [
    { symbol: 'BTC', name: 'Bitcoin', percent: 42, color: '#F7931A' },
    { symbol: 'ETH', name: 'Ethereum', percent: 30, color: '#627EEA' },
    { symbol: 'SOL', name: 'Solana', percent: 18, color: '#9945FF' },
    { symbol: 'TON', name: 'TON', percent: 10, color: '#0088CC' },
  ];

  return (
    <div className="glass-card h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
            <span className="text-sm">📊</span>
          </div>
          <h3 className="text-sm font-semibold text-primary">{t('Portfolio Allocation')}</h3>
        </div>
        <span className="text-xs text-secondary">${'24.56K'} {t('Total')}</span>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-6">
        <div className="w-32 h-32 rounded-full border-4 border-border-glass relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full" style={{
            background: `conic-gradient(
              ${assets[0].color} 0% ${assets[0].percent}%,
              ${assets[1].color} ${assets[0].percent}% ${assets[0].percent + assets[1].percent}%,
              ${assets[2].color} ${assets[0].percent + assets[1].percent}% ${assets[0].percent + assets[1].percent + assets[2].percent}%,
              ${assets[3].color} ${assets[0].percent + assets[1].percent + assets[2].percent}% 100%
            )`
          }} />
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center">
            <span className="text-xs text-secondary text-center">Total<br />$24.56K</span>
          </div>
        </div>

        <div className="flex-1 space-y-2 w-full">
          {assets.map((asset) => (
            <div key={asset.symbol} className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: asset.color }} />
                <span className="text-secondary">{asset.symbol}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-primary">{asset.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
