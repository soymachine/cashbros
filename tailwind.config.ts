import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['Share Tech Mono', 'Courier New', 'monospace'],
      },
      colors: {
        cyan: {
          neon: '#00ffff',
        },
        orange: {
          neon: '#ff6b00',
        },
      },
      animation: {
        flicker: 'flicker 3s linear infinite',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-cyan': 'glowCyan 2s ease-in-out infinite alternate',
        'glow-orange': 'glowOrange 2s ease-in-out infinite alternate',
      },
      keyframes: {
        flicker: {
          '0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%': {
            opacity: '1',
          },
          '20%, 21.999%, 63%, 63.999%, 65%, 69.999%': {
            opacity: '0.4',
          },
        },
        glowCyan: {
          '0%': { textShadow: '0 0 5px #00ffff, 0 0 10px #00ffff' },
          '100%': { textShadow: '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 40px #00ffff' },
        },
        glowOrange: {
          '0%': { textShadow: '0 0 5px #ff6b00, 0 0 10px #ff6b00' },
          '100%': { textShadow: '0 0 10px #ff6b00, 0 0 20px #ff6b00, 0 0 40px #ff6b00' },
        },
      },
      boxShadow: {
        'neon-cyan': '0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 20px #00ffff',
        'neon-orange': '0 0 5px #ff6b00, 0 0 10px #ff6b00, 0 0 20px #ff6b00',
        'neon-green': '0 0 5px #00ff88, 0 0 10px #00ff88, 0 0 20px #00ff88',
        'neon-red': '0 0 5px #ff0044, 0 0 10px #ff0044, 0 0 20px #ff0044',
      },
    },
  },
  plugins: [],
}

export default config
