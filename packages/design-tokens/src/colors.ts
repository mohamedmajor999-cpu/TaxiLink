// Palette unifiée web (Next.js + Tailwind) et mobile (Expo + NativeWind).
// Structure compatible Tailwind/NativeWind : valeurs hex en feuille,
// scales nommées (50→800) sous forme d'objets imbriqués.

export const colors = {
  // — Tokens dashboard legacy (anciennement packages/ui) —
  primary: '#FFD23F',
  secondary: '#1A1A1A',
  accent: '#3B82F6',
  bgsoft: '#F8F9FA',
  line: '#E5E7EB',
  muted: '#9CA3AF',

  // — Design system landing/refonte —
  ink: '#000000',
  paper: '#FFFFFF',

  brand: {
    DEFAULT: '#FFD11A',
    soft: '#FFF7CC',
  },

  warm: {
    50: '#F7F5EF',
    100: '#F1EFE8',
    200: '#E8E6DF',
    300: '#D3D1C7',
    500: '#888780',
    600: '#5F5E5A',
    800: '#2C2C2A',
  },

  // Mode nuit : gris-bleu legerement chaud, jaune amber desature.
  // Concue pour fatigue oculaire reduite (contraste WCAG AA, pas de pur blanc/noir/jaune).
  night: {
    bg: '#15171C',
    surface: '#1E2026',
    elevated: '#292B32',
    border: '#383A42',
    text: '#E5E2DA',
    'text-soft': '#9A9890',
    brand: '#D9A923',
    'brand-soft': '#3A2F12',
  },

  danger: { DEFAULT: '#A32D2D', soft: '#FCEBEB' },
  success: { DEFAULT: '#16A34A', soft: '#DCFCE7' },
} as const

export type ColorTokens = typeof colors
