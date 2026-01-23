import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#0A0A0A',
        border: '#38383A',
        primary: '#0A84FF',
        'primary-hover': '#409CFF',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        'iphone-xs': ['12px', { lineHeight: '16px' }],
        'iphone-sm': ['14px', { lineHeight: '20px' }],
        'iphone-base': ['16px', { lineHeight: '24px' }],
        'iphone-lg': ['18px', { lineHeight: '26px' }],
        'iphone-xl': ['20px', { lineHeight: '28px' }],
        'iphone-2xl': ['24px', { lineHeight: '32px' }],
        'iphone-3xl': ['30px', { lineHeight: '38px' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        'iphone-safe': 'env(safe-area-inset-top)',
        'iphone-safe-bottom': 'env(safe-area-inset-bottom)',
        'iphone-safe-left': 'env(safe-area-inset-left)',
        'iphone-safe-right': 'env(safe-area-inset-right)',
      },
      maxWidth: {
        'iphone': '428px',
      },
      screens: {
        'iphone': {'max': '428px'},
        'iphone-landscape': {'max': '926px', 'raw': '(max-width: 926px) and (orientation: landscape)'},
      },
      borderRadius: {
        'iphone': '20px',
        'iphone-xl': '24px',
      },
      animation: {
        'bounce-gentle': 'bounce 1s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config