// Typographie unifiee. Sur web, les `var(--font-*)` sont injectees par next/font.
// Sur mobile, les memes familles sont chargees via @expo-google-fonts/* puis
// declarees dans NativeWind via `fontFamily`.
//
// Note : pas de `as const` sur fontFamily/fontSize car Tailwind attend des
// types mutables (`string[]`, `[string, object]`). Les autres tokens (colors,
// shadows, radii) le supportent car ils sont en clefs/valeurs simples.

export const fontFamily: Record<string, string[]> = {
  sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
  serif: ['var(--font-serif)', "'Instrument Serif'", 'Georgia', 'serif'],
}

export const fontSize: Record<
  string,
  [string, { lineHeight?: string; letterSpacing?: string }]
> = {
  'display-xl': ['56px', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
  'display-lg': ['42px', { lineHeight: '1.1', letterSpacing: '-0.015em' }],
  'display-md': ['32px', { lineHeight: '1.15' }],
  'display-sm': ['26px', { lineHeight: '1.2' }],
}

// Familles "raw" pour mobile (sans var CSS, noms de fichiers Expo Google Fonts).
// Utiliser ces cles dans le NativeWind preset : `fontFamily: { sans: 'Inter_400Regular', ... }`.
export const mobileFontFamily = {
  sans: 'Inter_400Regular',
  'sans-medium': 'Inter_500Medium',
  'sans-semibold': 'Inter_600SemiBold',
  'sans-bold': 'Inter_700Bold',
  'sans-extrabold': 'Inter_800ExtraBold',
  // Le wordmark logo utilise Plus Jakarta Sans 800 (cf. memoire project_logo_wordmark)
  'logo-wordmark': 'PlusJakartaSans_800ExtraBold',
} as const

export type FontFamilyTokens = typeof fontFamily
export type FontSizeTokens = typeof fontSize
export type MobileFontFamilyTokens = typeof mobileFontFamily
