/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cryptra: {
          background: '#0a0a0f',
          foreground: '#f0f0f5',
          primary: '#8b5cf6',
          border: 'rgba(255,255,255,0.1)',
          muted: {
            foreground: 'rgba(255,255,255,0.5)',
          },
        },
      },
    },
  },
  plugins: [],
};
