import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Share Tech Mono"', 'monospace'],
      },
      colors: {
        'neon-cyan': '#00ffff',
        'neon-orange': '#ff6b00',
        'neon-green': '#00ff41',
      },
      keyframes: {
        flicker: {
          '0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%': {
            textShadow: '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 40px #00ffff',
          },
          '20%, 24%, 55%': {
            textShadow: 'none',
          },
        },
        'glow-pulse': {
          '0%, 100%': {
            textShadow: '0 0 10px currentColor, 0 0 20px currentColor',
            opacity: '1',
          },
          '50%': {
            textShadow: '0 0 20px currentColor, 0 0 40px currentColor, 0 0 60px currentColor',
            opacity: '0.9',
          },
        },
        'border-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 5px currentColor, 0 0 10px currentColor',
          },
          '50%': {
            boxShadow: '0 0 15px currentColor, 0 0 30px currentColor',
          },
        },
        'slide-in': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        flicker: 'flicker 3s linear infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'border-pulse': 'border-pulse 2s ease-in-out infinite',
        'slide-in': 'slide-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config
