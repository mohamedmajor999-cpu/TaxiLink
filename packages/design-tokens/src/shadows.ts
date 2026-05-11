// Ombres web (CSS box-shadow). Sur mobile (RN), un wrapper convertit
// vers les props natives `shadowColor/shadowOpacity/elevation` (cf. ui-mobile).

export const shadows = {
  soft: '0 2px 16px rgba(0,0,0,.04)',
  card: '0 4px 24px rgba(0,0,0,.06)',
  button: '0 2px 8px rgba(0,0,0,.08)',
  fab: '0 8px 24px rgba(255, 210, 63, 0.4)',
  'fab-hover': '0 12px 32px rgba(255, 210, 63, 0.5)',
  subtle: '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
  float: '0 8px 24px rgba(0,0,0,.08)',
  toast: '0 12px 32px rgba(0,0,0,.12)',
} as const

export type ShadowTokens = typeof shadows
