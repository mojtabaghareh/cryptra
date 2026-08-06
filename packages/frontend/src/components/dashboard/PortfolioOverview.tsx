// ============================================================
// PortfolioOverview.tsx - Premium Portfolio Card with Chart
// ============================================================

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function PortfolioOverview() {
  const { t } = useTranslation();
  const [timeframe, setTimeframe] = useState('24H');

  const timeframes = ['1H', '24H', '7D', '30D', '1Y', 'ALL'];

  return (
    <div className="gradient-card relative overflow-hidden mb-6 lg:mb-8">
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent rounded-full opacity-10 blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent rounded-full opacity-10 blur-2xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-white/70">{t('Portfolio Overview')}</p>
              <div className="flex items-baseline gap-3 mt-1">
                <h2 className="text-3xl lg:text-4xl font-bold text-white">
                  $24,560.75
                </h2>
                <div className="glass px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="text-success text-xs">▲</span>
                  <span className="text-white/80 text-xs">+8.22%</span>
                </div>
              </div>
              <p className="text-xs text-white/60 mt-1">
                ▲ $1,850.25 ({t('Today')})
              </p>
            </div>
          </div>

          <div className="h-24 flex items-end gap-2 justify-between mt-4">
            {[40, 55, 45, 70, 60, 85, 75, 90, 65, 80, 70, 95].map((h, i) => (
              <div 
                key={i} 
                className="flex-1 bg-gradient-to-t from-white/30 to-white rounded-t-sm hover:from-white/50 transition-all" 
                style={{ height: `${h}%` }} 
              />
            ))}
          </div>

          <div className="flex gap-2 mt-2">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  timeframe === tf 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col items-center justify-center relative">
          <div className="w-32 h-32 rounded-full border-8 border-accent/30 flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-success border-r-warning border-b-accent border-l-danger" 
                 style={{ transform: 'rotate(-45deg)' }} />
            <div className="text-center">
              <p className="text-xs text-white/70">Total</p>
              <p className="text-sm font-bold text-white">$24.56K</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-3 text-xs">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" />BTC 42%</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" />ETH 30%</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent" />SOL 18%</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-danger" />TON 10%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
