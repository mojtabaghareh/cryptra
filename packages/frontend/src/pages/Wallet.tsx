// ============================================================
// Wallet.tsx
// صفحه اتصال و مدیریت کیف پول‌های کاربر
// ============================================================

import React, { useState } from 'react';

interface ConnectedWallet {
  id: string;
  name: string;
  address: string;
  chain: string;
  isActive: boolean;
}

export default function Wallet() {
  const [wallets, setWallets] = useState<ConnectedWallet[]>([
    {
      id: '1',
      name: 'MetaMask',
      address: '0x1234...5678',
      chain: 'Ethereum',
      isActive: true,
    },
    {
      id: '2',
      name: 'Phantom',
      address: '7V2R...J5Qb',
      chain: 'Solana',
      isActive: false,
    },
  ]);

  const connectWallet = () => {
    // شبیه‌سازی اتصال کیف پول جدید
    const newWallet: ConnectedWallet = {
      id: Date.now().toString(),
      name: 'WalletConnect',
      address: '0x' + Math.random().toString(16).substring(2, 10) + '...',
      chain: 'Ethereum',
      isActive: false,
    };
    setWallets([...wallets, newWallet]);
  };

  return (
    <div className="p-4">
      {/* هدر صفحه */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-3xl">👛</span>
        <h1 className="text-2xl font-bold">Wallet</h1>
      </div>

      {/* لیست کیف‌پول‌های متصل */}
      <div className="space-y-3 mb-6">
        {wallets.map((wallet) => (
          <div
            key={wallet.id}
            className={`card border-border p-4 flex items-center justify-between transition ${
              wallet.isActive ? 'border-accent/50' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${wallet.isActive ? 'bg-success' : 'bg-muted'}`} />
              <div>
                <p className="font-medium text-primary">{wallet.name}</p>
                <p className="text-xs text-secondary">{wallet.address}</p>
                <p className="text-xs text-muted">{wallet.chain}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="text-xs text-accent hover:underline">Connect</button>
              <button className="text-xs text-danger hover:underline">Disconnect</button>
            </div>
          </div>
        ))}
      </div>

      {/* دکمه اتصال کیف پول جدید */}
      <button
        onClick={connectWallet}
        className="w-full py-3 bg-accent text-white font-medium rounded-xl hover:opacity-90 transition"
      >
        + Connect New Wallet
      </button>

      {/* اطلاعات امنیتی */}
      <div className="mt-6 card border-border">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🔒</span>
          <h2 className="text-sm font-semibold text-secondary">Active Sessions</h2>
        </div>
        <p className="text-xs text-secondary">
          You have 1 active session. This device is currently connected.
        </p>
        <button className="mt-3 text-xs text-danger hover:underline">Terminate all sessions</button>
      </div>
    </div>
  );
}
