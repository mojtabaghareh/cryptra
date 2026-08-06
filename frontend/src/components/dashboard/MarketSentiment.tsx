// ============================================================
// MarketSentiment.tsx - Market Sentiment Gauge
// ============================================================

import React from 'react';
import { useTranslation } from 'react-i18next';

export default function MarketSentiment() {
  const { t } = useTranslation();
  const sentiment = 72;
  const status = sentiment > 70 ? 'Greed' : sentiment > 50 ? 'Neutral' : 'Fear';

  return (
    <div className="glass-card h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
          <span className="text-sm">🫀</span>
        </div>
        <h3 className="text-sm font-semibold text-primary">{t('Market Sentiment')}</h3>
      </div>

      <div className="flex-1 flex items-center justify-center relative">
        {/* گیج ساده با CSS */}
        <div className="w-40 h-20 overflow-hidden relative">
          <div className="w-40 h-40 rounded-full border-8 border-border-glass absolute bottom-0 left-0" />
          <div className="w-40 h-40 rounded-full border-8 border-transparent border-t-success border-r-warning border-b-danger absolute bottom-0 left-0"
            style={{ transform: `rotate(${(sentiment / 100) * 180 - 90}deg)` }}
          />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-8 bg-primary rounded-full origin-bottom"
            style={{ transform: `rotate(${(sentiment / 100) * 180 - 90}deg)` }}
          />
        </div>
        <div className="absolute bottom-4 text-center">
          <p className="text-3xl font-bold text-primary">{sentiment}</p>
          <p className={`text-sm font-medium ${sentiment > 70 ? 'text-success' : sentiment > 50 ? 'text-warning' : 'text-danger'}`}>
            {status}
          </p>
          <p className="text-xs text-secondary">Market is in a {status.toLowerCase()} state</p>
        </div>
      </div>
    </div>
  );
}
