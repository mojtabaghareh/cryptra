import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@cryptra/core': path.resolve(__dirname, '../../packages/core'),
      '@cryptra/ui': path.resolve(__dirname, '../../packages/ui'),
      '@cryptra/i18n': path.resolve(__dirname, '../../packages/i18n'),
      '@cryptra/wallets': path.resolve(__dirname, '../../packages/wallets'),
      '@cryptra/swap-engine': path.resolve(__dirname, '../../packages/swap-engine'),
      '@cryptra/market-data': path.resolve(__dirname, '../../packages/market-data'),
      '@cryptra/fees': path.resolve(__dirname, '../../packages/fees'),
      '@cryptra/xp': path.resolve(__dirname, '../../packages/xp'),
      '@cryptra/levels': path.resolve(__dirname, '../../packages/levels'),
      '@cryptra/referral': path.resolve(__dirname, '../../packages/referral'),
      '@cryptra/leaderboard': path.resolve(__dirname, '../../packages/leaderboard'),
      '@cryptra/rewards': path.resolve(__dirname, '../../packages/rewards'),
      '@cryptra/telegram': path.resolve(__dirname, '../../packages/telegram'),
      '@cryptra/security': path.resolve(__dirname, '../../packages/security'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});

