// ============================================================
// Wallet.tsx (نسخه واقعی با WalletManager)
// ============================================================

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
// ایمپورت سیستم واقعی ما
import { walletManager } from '../../../adapters/src/wallet-connectors/WalletManager';
import { registerWallets } from '../../../adapters/src/wallet-connectors/registerWallets';

// یک بار در طول عمر برنامه ثبت نام می‌کنیم
registerWallets();

interface ConnectedWallet {
  id: string;
  name: string;
  address: string;
  chain: string;
  isActive: boolean;
  icon: string;
  balance?: string;
}

export default function Wallet() {
  const { t } = useTranslation();
  const [wallets, setWallets] = useState<ConnectedWallet[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // تابع اتصال به کیف پول واقعی
  const connectWallet = async () => {
    setIsLoading(true);
    try {
      // 1. لیست ولت‌های نصب شده را از سیستم می‌گیریم
      const installed = walletManager.getInstalledAdapters();
      
      if (installed.length === 0) {
        alert("لطفاً متامسک یا فانتوم را در مرورگر خود نصب کنید!");
        return;
      }

      // 2. به اولین ولت نصب شده (مثلاً متامسک) وصل می‌شویم
      const adapter = installed[0];
      const account = await walletManager.connect(adapter.id);
      
      // 3. موجودی واقعی را می‌خوانیم
      const balance = await walletManager.getBalance();

      // 4. ولت جدید را به لیست UI اضافه می‌کنیم
      const newWallet: ConnectedWallet = {
        id: adapter.id,
        name: adapter.name,
        address: account.address,
        chain: typeof account.chainId === 'number' ? 'Ethereum' : account.chainId.toString(),
        isActive: true,
        icon: adapter.id === 'metamask' ? '🦊' : adapter.id === 'phantom' ? '👻' : '🟣',
        balance: `${balance} ETH`,
      };

      setWallets([newWallet]);
      
    } catch (error: any) {
      console.error(error);
      alert(error.message || "خطا در اتصال به کیف پول");
    } finally {
      setIsLoading(false);
    }
  };

  // تابع قطع اتصال
  const disconnectWallet = async (walletId: string) => {
    try {
      await walletManager.disconnect();
      // حذف ولت از لیست UI
      setWallets(wallets.filter(w => w.id !== walletId));
    } catch (error: any) {
      alert(error.message || "خطا در قطع اتصال");
    }
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
        {wallets.length === 0 && (
          <div className="text-center text-secondary text-sm py-10 opacity-70">
            هیچ کیف پولی متصل نیست. برای اتصال دکمه پایین را بزنید.
          </div>
        )}

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
            <div className="text-right">
              <p className="text-xs text-success font-medium">{wallet.balance}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => disconnectWallet(wallet.id)}
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
        disabled={isLoading}
        className="w-full py-4 bg-gradient-to-r from-accent to-accent-glow text-white text-sm font-bold rounded-xl shadow-lg shadow-accent-glow hover:shadow-xl hover:shadow-accent-glow/50 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>+</span> {isLoading ? "در حال اتصال..." : t('Connect New Wallet')}
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
