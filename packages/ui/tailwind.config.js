/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cryptra: {
          background: 'var(--cryptra-background)',
          foreground: 'var(--cryptra-foreground)',
          primary: 'var(--cryptra-primary)',
          'primary-foreground': 'var(--cryptra-primary-foreground)',
          secondary: 'var(--cryptra-secondary)',
          'secondary-foreground': 'var(--cryptra-secondary-foreground)',
          muted: 'var(--cryptra-muted)',
          'muted-foreground': 'var(--cryptra-muted-foreground)',
          accent: 'var(--cryptra-accent)',
          'accent-foreground': 'var(--cryptra-accent-foreground)',
          destructive: 'var(--cryptra-destructive)',
          'destructive-foreground': 'var(--cryptra-destructive-foreground)',
          border: 'var(--cryptra-border)',
          input: 'var(--cryptra-input)',
          ring: 'var(--cryptra-ring)',
          card: 'var(--cryptra-card)',
          'card-foreground': 'var(--cryptra-card-foreground)',
          neon: {
            blue: '#00f0ff',
            pink: '#ff00ff',
            green: '#39ff14',
            purple: '#b026ff',
            cyan: '#00ffff',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        'neon-pulse': {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.8', filter: 'brightness(1.2)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'neon-blue': '0 0 5px #00f0ff, 0 0 20px #00f0ff40',
        'neon-pink': '0 0 5px #ff00ff, 0 0 20px #ff00ff40',
        'neon-green': '0 0 5px #39ff14, 
