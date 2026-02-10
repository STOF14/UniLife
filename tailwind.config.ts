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
        // Swiss monochrome palette
        background: '#0A0A0A',
        surface: '#111111',
        'surface-hover': '#161616',
        'surface-active': '#1A1A1A',
        border: '#1E1E1E',
        'border-hover': '#2A2A2A',
        // Typography
        'text-primary': '#E8E8E8',
        'text-secondary': '#666666',
        'text-tertiary': '#444444',
        'text-muted': '#333333',
        // Functional (used sparingly)
        accent: '#E8E8E8',
        'accent-hover': '#FFFFFF',
        danger: '#FF3B30',
        'danger-muted': 'rgba(255, 59, 48, 0.12)',
        success: '#34C759',
        'success-muted': 'rgba(52, 199, 89, 0.12)',
        warning: '#FF9F0A',
        'warning-muted': 'rgba(255, 159, 10, 0.12)',
        // Legacy compat
        primary: '#E8E8E8',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'SF Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        // Swiss typographic scale — clear hierarchy, decisive jumps
        'display': ['64px', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '600' }],
        'headline': ['48px', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '600' }],
        'title-lg': ['32px', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '600' }],
        'title': ['24px', { lineHeight: '1.2', letterSpacing: '-0.015em', fontWeight: '600' }],
        'title-sm': ['20px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '500' }],
        'body-lg': ['16px', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }],
        'body': ['14px', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '1.45', letterSpacing: '0', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '400' }],
        'label': ['11px', { lineHeight: '1.3', letterSpacing: '0.08em', fontWeight: '500' }],
        'overline': ['10px', { lineHeight: '1.2', letterSpacing: '0.12em', fontWeight: '600' }],
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
        'DEFAULT': '4px',
        'md': '6px',
        'lg': '8px',
      },
      animation: {
        'fade-in': 'fadeIn 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-right': 'slideRight 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-left': 'slideLeft 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fill-bar': 'fillBar 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'underline-grow': 'underlineGrow 200ms ease-out forwards',
        'stagger-in': 'staggerIn 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
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
        'swiss': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'swift': 'cubic-bezier(0.55, 0, 0.1, 1)',
      },
      transitionDuration: {
        '150': '150ms',
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