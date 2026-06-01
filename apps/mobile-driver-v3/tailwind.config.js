// NativeWind v4 + Tailwind v3.4. Tokens partagés cross-platform via @taxilink/design-tokens.
/** @type {import('tailwindcss').Config} */
const { colors, borderRadius, fontSize, mobileFontFamily } = require('@taxilink/design-tokens');

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
      },
      fontSize,
    },
  },
  plugins: [],
};
