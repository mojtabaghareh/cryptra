import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // جلوگیری از اسکن پوشه‌های دیگر توسط Vite
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})