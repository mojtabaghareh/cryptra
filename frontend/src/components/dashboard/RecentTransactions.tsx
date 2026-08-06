// ============================================================
// RecentTransactions.tsx - Recent Transaction List
// ============================================================

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function RecentTransactions() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const transactions = [
    { type: 'Swap', from: 'ETH', to: 'USDC', amount: '+1,250.75', time: '2 min ago', icon: '↔', color: 'bg-accent/20 text-accent' },
    { type: 'Buy', from: 'BTC', to: '', amount: '+0.025 BTC', time: '15 min ago', icon: '🟢', color: 'bg-success/20 text-success' },
    { type: 'Send', to: '0x7b3...9f2', amount: '-0.5 ETH', time: '1 hour ago', icon: '📤', color: 'bg-warning/20 text-warning' },
    { type: 'Receive', from: '0xa2...5dF', amount: '+2.3 SOL', time: '3 hours ago', icon: '📥', color: 'bg-accent/20 text-accent' },
  ];

  return (
    <div className="glass-card h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
            <span className="text-sm">🔄</span>
          </div>
          <h3 className="text-sm font-semibold text-primary">{t('Recent Transactions')}</h3>
        </div>
        <span className="text-xs text-secondary">{t('View All')}</span>
      </div>

      <div className="space-y-3">
        {transactions.map((tx, index) => (
          <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.color}`}>
                <span className="text-sm">{tx.icon}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-primary">{tx.type}</p>
                <p className="text-xs text-secondary">
                  {tx.from ? `${tx.from} → ${tx.to || ''}` : tx.to || ''}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium ${tx.amount.startsWith('+') ? 'text-success' : 'text-danger'}`}>
                {tx.amount}
              </p>
              <p className="text-xs text-secondary">{tx.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
