// Design tokens partagés. Consommés par apps/web/tailwind.config.ts
// et destinés à une future app mobile. Les clés reflètent la nomenclature
// Tailwind utilisée dans le code (classes utilitaires).

export const colors = {
  primary: '#FFD23F',
  secondary: '#1A1A1A',
  accent: '#3B82F6',
  bgsoft: '#F8F9FA',
  line: '#E5E7EB',
  muted: '#9CA3AF',
} as const

export const shadows = {
  soft: '0 2px 16px rgba(0,0,0,.04)',
  card: '0 4px 24px rgba(0,0,0,.06)',
  button: '0 2px 8px rgba(0,0,0,.08)',
  fab: '0 8px 24px rgba(255, 210, 63, 0.4)',
} as const

export const borderRadius = {
  '2xl': '16px',
  '3xl': '20px',
  '4xl': '32px',
} as const
