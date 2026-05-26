import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Fondo y superficies
        background: '#0d0d0d',
        surface: '#111827',
        'surface-2': '#1f2937',

        // Paleta Kings (del logo)
        primary: {
          DEFAULT: '#1e3a8a',
          hover: '#1e40af',
          foreground: '#f9fafb',
        },
        secondary: {
          DEFAULT: '#2563eb',
          hover: '#3b82f6',
          foreground: '#f9fafb',
        },
        accent: {
          DEFAULT: '#22d3ee',
          hover: '#06b6d4',
          foreground: '#0d0d0d',
        },

        // Shadcn compatible
        card: {
          DEFAULT: '#111827',
          foreground: '#f9fafb',
        },
        popover: {
          DEFAULT: '#1f2937',
          foreground: '#f9fafb',
        },
        muted: {
          DEFAULT: '#374151',
          foreground: '#9ca3af',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#f9fafb',
        },
        border: '#1f2937',
        input: '#1f2937',
        ring: '#2563eb',
        foreground: '#f9fafb',

        // Estados de fase OT
        fase: {
          pending: '#374151',
          active: '#2563eb',
          done: '#16a34a',
          rejected: '#ef4444',
        },
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-cyan': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(34,211,238,0.4)' },
          '50%': { boxShadow: '0 0 0 6px rgba(34,211,238,0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'pulse-cyan': 'pulse-cyan 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
