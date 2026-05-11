// NativeWind v4 + Tailwind v3.4. Reutilise les tokens partages cross-platform
// declares dans @taxilink/design-tokens (importes aussi par apps/web/tailwind.config.ts).
//
// Note : on importe via require() (CommonJS) car ce fichier est evalue par
// Metro/Babel a la compile, hors contexte ESM.

/** @type {import('tailwindcss').Config} */
const {
  colors,
  borderRadius,
  fontSize,
  mobileFontFamily,
} = require('@taxilink/design-tokens')

module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors,
      borderRadius,
      fontFamily: {
        sans: [mobileFontFamily.sans],
        'sans-medium': [mobileFontFamily['sans-medium']],
        'sans-semibold': [mobileFontFamily['sans-semibold']],
        'sans-bold': [mobileFontFamily['sans-bold']],
        'sans-extrabold': [mobileFontFamily['sans-extrabold']],
        'logo-wordmark': [mobileFontFamily['logo-wordmark']],
      },
      fontSize,
    },
  },
  plugins: [],
}
