// ============================================================
// Wallet.tsx (نسخه‌ی نهایی - پریمیوم با Glassmorphism)
// ============================================================

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ConnectedWallet {
  id: string;
  name: string;
  address: string;
  chain: string;
  isActive: boolean;
  icon: string;
}

export default function Wallet() {
  const { t } = useTranslation();
  const [wallets, setWallets] = useState<ConnectedWallet[]>([
    {
      id: '1',
      name: 'MetaMask',
      address: '0x1234...5678',
      chain: 'Ethereum',
      isActive: true,
      icon: '🦊',
    },
    {
      id: '2',
      name: 'Phantom',
      address: '7V2R...J5Qb',
      chain: 'Solana',
      isActive: false,
      icon: '👻',
    },
  ]);

  const connectWallet = () => {
    const newWallet: ConnectedWallet = {
      id: Date.now().toString(),
      name: 'WalletConnect',
      address: '0x' + Math.random().toString(16).substring(2, 10) + '...',
      chain: 'Ethereum',
      isActive: false,
      icon: '🟣',
    };
    setWallets([...wallets, newWallet]);
  };

  return (
    <div className="container pb-4">
      {/* هدر پریمیوم */}
      <div className="flex items-center justify-between mb-6 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center shadow-lg shadow-accent-glow">
            <span className="text-lg">👛</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gradient">{t('Wallet')}</h1>
        </div>
        <div className="glass px-3 py-1.5 rounded-lg border border-border-glass">
          <span className="text-xs text-secondary font-medium">
            {wallets.length} {t('Connected')}
          </span>
        </div>
      </div>

      {/* لیست کیف‌پول‌های متصل */}
      <div className="space-y-3 mb-6">
        {wallets.map((wallet) => (
          <div
            key={wallet.id}
            className={`glass-card p-4 flex items-center justify-between transition-all duration-300 hover:bg-card-hover border-border-glass ${
              wallet.isActive ? 'border-accent border-opacity-50 shadow-glow-accent' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ring-2 ${
                  wallet.isActive 
                    ? 'bg-success ring-success/30' 
                    : 'bg-muted ring-muted/30'
                }`}
              />
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                  wallet.isActive ? 'bg-accent/20' : 'bg-white/5'
                }`}
              >
                {wallet.icon}
              </div>
              <div>
                <p className="font-medium text-primary text-sm">{wallet.name}</p>
                <p className="text-xs text-secondary font-mono">{wallet.address}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted bg-white/5 px-2 py-0.5 rounded-full">
                    {wallet.chain}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-300 ${
                  wallet.isActive
                    ? 'glass text-danger hover:bg-danger/10 border border-border-glass'
                    : 'glass text-accent hover:bg-accent/10 border border-border-glass'
                }`}
              >
                {wallet.isActive ? t('Disconnect') : t('Connect')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* دکمه اتصال کیف پول جدید */}
      <button
        onClick={connectWallet}
        className="w-full py-4 bg-gradient-to-r from-accent to-accent-glow text-white text-sm font-bold rounded-xl shadow-lg shadow-accent-glow hover:shadow-xl hover:shadow-accent-glow/50 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
      >
        <span>+</span> {t('Connect New Wallet')}
      </button>

      {/* اطلاعات امنیتی */}
      <div className="glass-card mt-6 border border-border-glass">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
            <span className="text-sm">🔒</span>
          </div>
          <h2 className="text-sm font-semibold text-primary">{t('Active Sessions')}</h2>
        </div>
        <div className="glass p-3 rounded-lg border border-border-glass mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-xs text-secondary">This device</span>
            </div>
            <span className="text-xs text-muted">Active now</span>
          </div>
        </div>
        <button className="text-xs text-danger hover:underline font-medium">
          {t('Terminate all sessions')}
        </button>
      </div>
    </div>
  );
} 