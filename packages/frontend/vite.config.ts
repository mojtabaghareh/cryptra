import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/cryptra/',
  // این خط باعث می‌شود Vite پکیج ethers را درست پیدا کند
  optimizeDeps: {
    include: [
      'ethers', 
      'react', 
      'react-dom', 
      'react-router-dom', 
      'react-i18next',
      // این بخش برای اطمینان از دیده شدن آداپتورهای شماست
      '@solana/web3.js',
      '@solana/wallet-adapter-phantom',
      '@tonconnect/sdk'
    ]
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      external: []
    }
  }
})