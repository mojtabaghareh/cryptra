import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // مهم: این خط باعث می‌شود Vite کتابخانه‌های adapters را در بیلد ببیند
  optimizeDeps: {
    include: ['ethers', 'react', 'react-dom', 'react-router-dom', 'react-i18next']
  },
  // این تنظیم به ساختن فایل‌های استاتیک برای GitHub Pages کمک می‌کند
  base: '/cryptra/', // این را حتماً چک کنید! باید با نام رپوزیتوری شما یکی باشد
  build: {
    sourcemap: true,
    rollupOptions: {
      external: []
    }
  }
})