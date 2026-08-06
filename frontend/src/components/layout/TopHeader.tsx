// ============================================================
// TopHeader.tsx - Premium Top Header for Desktop & Mobile
// ============================================================

import React from 'react';

interface TopHeaderProps {
  isDesktop: boolean;
}

export default function TopHeader({ isDesktop }: TopHeaderProps) {
  return (
    <header className="glass border-b border-border-glass p-3 lg:p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1">
        {/* در موبایل، لوگو را نشان بده */}
        {!isDesktop && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center">
              <span className="text-sm">🔷</span>
            </div>
            <span className="text-lg font-bold text-gradient">Cryptra</span>
          </div>
        )}

        {/* نوار جستجو */}
        <div className="hidden lg:flex flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="Search tokens, markets, wallets..."
            className="w-full glass px-4 py-2 rounded-xl text-sm outline-none border border-border-glass focus:border-accent transition-colors text-primary placeholder-secondary"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary text-xs">⌘K</span>
        </div>
      </div>

      {/* دکمه‌های سمت راست */}
      <div className="flex items-center gap-2">
        <button className="btn-icon relative">
          <span className="text-lg">🔔</span>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full text-[8px] flex items-center justify-center text-white">3</span>
        </button>
        <button className="btn-icon text-lg">🌐</button>
        <button className="btn-icon text-lg">☀️</button>
        <button className="glass px-3 py-1.5 rounded-xl border border-border-glass flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-xs text-primary font-medium">0x34A8...5dF</span>
        </button>
      </div>
    </header>
  );
}
