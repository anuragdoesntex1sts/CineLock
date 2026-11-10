/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic colors from DESIGN.md
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'brand-primary': 'var(--brand-primary)',
        'brand-hover': 'var(--brand-hover)',
        'brand-light': 'var(--brand-light)',
        'success': 'var(--success)',
        'success-light': 'var(--success-light)',
        'warning': 'var(--warning)',
        'warning-light': 'var(--warning-light)',
        'danger': 'var(--danger)',
        'danger-light': 'var(--danger-light)',
        'selected': 'var(--selected)',
        'selected-light': 'var(--selected-light)',
        'border': 'var(--border)',
        'border-focus': 'var(--border-focus)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        'display': ['3rem', { lineHeight: '1.1', fontWeight: '700' }],
        'h1': ['2rem', { lineHeight: '1.2', fontWeight: '700' }],
        'h2': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
        'mono': ['0.875rem', { lineHeight: '1.6', fontWeight: '400' }],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '24px',
        '6': '32px',
        '8': '48px',
        '10': '64px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0,0,0,0.05)',
        'md': '0 4px 12px rgba(0,0,0,0.08)',
        'lg': '0 12px 32px rgba(0,0,0,0.12)',
        'focus': '0 0 0 3px var(--brand-light)',
      },
      transitionDuration: {
        'fast': '100ms',
        'normal': '150ms',
        'slow': '200ms',
        'modal': '250ms',
      },
      transitionTimingFunction: {
        'standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'pop': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'pulse-slow': 'pulse 1.5s ease-in-out infinite',
        'spin-slow': 'spin 800ms linear infinite',
        'fade-in': 'fadeIn 200ms var(--transition-standard)',
        'slide-up': 'slideUp 200ms var(--transition-pop)',
        'slide-down': 'slideDown 150ms var(--transition-standard)',
        'scale-in': 'scaleIn 150ms var(--transition-pop)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}