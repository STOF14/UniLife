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
        // Saisei-inspired warm neutral system
        background: '#F0EDE6',
        surface: '#E8E4DA',
        'surface-hover': '#DED8CA',
        'surface-active': '#D3CCBE',
        border: '#C9C1B2',
        'border-hover': '#A79F91',
        // Text hierarchy
        'text-primary': '#1A1916',
        'text-secondary': '#2E2D29',
        'text-tertiary': '#6F6A61',
        'text-muted': '#8C8A82',
        // Structural accents
        accent: '#2E2D29',
        'accent-hover': '#1A1916',
        ink: '#1A1916',
        charcoal: '#2E2D29',
        parchment: '#F0EDE6',
        sand: '#E8E4DA',
        // Functional (subtle and desaturated)
        danger: '#9A4F45',
        'danger-muted': 'rgba(154, 79, 69, 0.14)',
        success: '#567045',
        'success-muted': 'rgba(86, 112, 69, 0.14)',
        warning: '#9B7A3C',
        'warning-muted': 'rgba(155, 122, 60, 0.14)',
        info: '#5D6E81',
        'info-muted': 'rgba(93, 110, 129, 0.14)',
        // Legacy compat
        primary: '#2E2D29',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Manrope', 'Avenir Next', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['var(--font-display)', 'Newsreader', 'Iowan Old Style', 'Times New Roman', 'serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'SF Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        // Editorial hierarchy with calm, long-form rhythm
        'display': ['72px', { lineHeight: '0.98', letterSpacing: '-0.032em', fontWeight: '500' }],
        'headline': ['52px', { lineHeight: '1.02', letterSpacing: '-0.028em', fontWeight: '500' }],
        'title-lg': ['34px', { lineHeight: '1.08', letterSpacing: '-0.022em', fontWeight: '500' }],
        'title': ['26px', { lineHeight: '1.18', letterSpacing: '-0.016em', fontWeight: '500' }],
        'title-sm': ['21px', { lineHeight: '1.24', letterSpacing: '-0.01em', fontWeight: '500' }],
        'body-lg': ['17px', { lineHeight: '1.62', letterSpacing: '-0.002em', fontWeight: '400' }],
        'body': ['15px', { lineHeight: '1.58', letterSpacing: '-0.001em', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '1.45', letterSpacing: '0.012em', fontWeight: '400' }],
        'label': ['11px', { lineHeight: '1.35', letterSpacing: '0.1em', fontWeight: '500' }],
        'overline': ['10px', { lineHeight: '1.25', letterSpacing: '0.14em', fontWeight: '600' }],
      },
      spacing: {
        // 8px grid system
        '0.5': '4px',
        '1': '8px',
        '1.5': '12px',
        '2': '16px',
        '3': '24px',
        '4': '32px',
        '5': '40px',
        '6': '48px',
        '8': '64px',
        '10': '80px',
        '12': '96px',
        '16': '128px',
        '18': '144px',
        '24': '192px',
        '32': '256px',
        // Safe areas
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      maxWidth: {
        'mobile': '428px',
        'content': '960px',
        'wide': '1200px',
      },
      screens: {
        'mobile': { 'max': '428px' },
        'tablet': '768px',
        'desktop': '1024px',
        'wide': '1440px',
      },
      borderRadius: {
        'none': '0px',
        'sm': '2px',
        'DEFAULT': '6px',
        'md': '10px',
        'lg': '14px',
        'xl': '20px',
      },
      boxShadow: {
        'surface': '0 1px 0 rgba(26, 25, 22, 0.05), 0 12px 28px rgba(26, 25, 22, 0.08)',
        'surface-soft': '0 1px 0 rgba(26, 25, 22, 0.04), 0 6px 18px rgba(26, 25, 22, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 420ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'slide-up': 'slideUp 620ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'slide-down': 'slideDown 420ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'slide-right': 'slideRight 420ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'slide-left': 'slideLeft 420ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'scale-in': 'scaleIn 320ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'fill-bar': 'fillBar 760ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'underline-grow': 'underlineGrow 300ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'stagger-in': 'staggerIn 520ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
        'marquee': 'marquee 20s linear infinite',
        'spin': 'spin 1s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fillBar: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--bar-width, 0%)' },
        },
        underlineGrow: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        staggerIn: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      transitionTimingFunction: {
        'swiss': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'swift': 'cubic-bezier(0.55, 0, 0.1, 1)',
        'contemplative': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        '150': '150ms',
        '220': '220ms',
        '420': '420ms',
        '620': '620ms',
        '760': '760ms',
        // Legacy durations used in existing components
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
        '800': '800ms',
      },
    },
  },
  plugins: [],
}
export default config