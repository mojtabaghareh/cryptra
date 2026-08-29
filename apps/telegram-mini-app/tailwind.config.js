/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cryptra: {
          background: '#050510',
          surface: '#0c0c1a',
          card: '#12122a',
          foreground: '#eef2ff',
          primary: '#3b82f6',
          accent: '#22d3ee',
          neon: '#00f0ff',
          border: 'rgba(59,130,246,0.25)',
          muted: {
            foreground: 'rgba(226,232,255,0.55)',
          },
          success: '#22c55e',
          danger: '#ef4444',
        },
      },
      boxShadow: {
        neon: '0 0 20px rgba(0,240,255,0.25)',
        'neon-blue': '0 0 24px rgba(59,130,246,0.35)',
      },
      backgroundImage: {
        'cryptra-radial':
          'radial-gradient(ellipse at top, rgba(30,64,175,0.35), transparent 55%), radial-gradient(ellipse at bottom, rgba(0,240,255,0.08), transparent 50%)',
      },
    },
  },
  plugins: [],
};
