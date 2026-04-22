import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // — Tokens existants (dashboard) —
        primary: '#FFD23F',
        secondary: '#1A1A1A',
        accent: '#3B82F6',
        bgsoft: '#F8F9FA',
        line: '#E5E7EB',
        muted: '#9CA3AF',
        // — Nouveau design system (landing refonte) —
        ink: '#000000',
        paper: '#FFFFFF',
        brand: { DEFAULT: '#FFD11A', soft: '#FFF7CC' },
        warm: {
          50: '#F7F5EF',
          100: '#F1EFE8',
          200: '#E8E6DF',
          300: '#D3D1C7',
          500: '#888780',
          600: '#5F5E5A',
          800: '#2C2C2A',
        },
        danger: { DEFAULT: '#A32D2D', soft: '#FCEBEB' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        serif: ['var(--font-serif)', "'Instrument Serif'", 'Georgia', 'serif'],
      },
      fontSize: {
        'display-xl': ['56px', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-lg': ['42px', { lineHeight: '1.1', letterSpacing: '-0.015em' }],
        'display-md': ['32px', { lineHeight: '1.15' }],
        'display-sm': ['26px', { lineHeight: '1.2' }],
      },
      boxShadow: {
        soft: '0 2px 16px rgba(0,0,0,.04)',
        card: '0 4px 24px rgba(0,0,0,.06)',
        button: '0 2px 8px rgba(0,0,0,.08)',
        fab: '0 8px 24px rgba(255, 210, 63, 0.4)',
        'fab-hover': '0 12px 32px rgba(255, 210, 63, 0.5)',
        subtle: '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
        float: '0 8px 24px rgba(0,0,0,.08)',
        toast: '0 12px 32px rgba(0,0,0,.12)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '32px',
      },
      animation: {
        'gradient-shift': 'gradientShift 3s ease infinite',
        'status-pulse': 'statusPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in': 'fadeIn 0.2s ease',
        'float-a': 'floatA 6s ease-in-out infinite',
        'float-b': 'floatB 7s ease-in-out infinite',
        'float-c': 'floatC 8s ease-in-out infinite',
        'float-d': 'floatD 6.5s ease-in-out infinite',
        'mic-pulse': 'micPulse 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'mic-ring': 'micRing 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'voice-bar': 'voiceBar 0.9s ease-in-out infinite',
        'pop-in': 'popIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both',
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        statusPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.3' },
          '50%': { transform: 'scale(1.1)', opacity: '0' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        floatA: {
          '0%, 100%': { transform: 'translateY(0) rotate(-1deg)' },
          '50%':      { transform: 'translateY(-10px) rotate(-1deg)' },
        },
        floatB: {
          '0%, 100%': { transform: 'translateY(0) rotate(0.8deg)' },
          '50%':      { transform: 'translateY(-8px) rotate(0.8deg)' },
        },
        floatC: {
          '0%, 100%': { transform: 'translateY(0) rotate(1.2deg)' },
          '50%':      { transform: 'translateY(-12px) rotate(1.2deg)' },
        },
        floatD: {
          '0%, 100%': { transform: 'translateY(0) rotate(-0.6deg)' },
          '50%':      { transform: 'translateY(-7px) rotate(-0.6deg)' },
        },
        micPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%':      { transform: 'scale(1.08)' },
        },
        micRing: {
          '0%':   { transform: 'scale(1)',   opacity: '0.55' },
          '100%': { transform: 'scale(1.9)', opacity: '0' },
        },
        voiceBar: {
          '0%, 100%': { transform: 'scaleY(0.35)' },
          '50%':      { transform: 'scaleY(1)' },
        },
        popIn: {
          '0%':   { transform: 'scale(0.4)', opacity: '0' },
          '70%':  { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
