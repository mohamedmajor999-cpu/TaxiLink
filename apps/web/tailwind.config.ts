import type { Config } from 'tailwindcss'
import {
  colors,
  shadows,
  borderRadius,
  fontFamily,
  fontSize,
  animation,
  keyframes,
} from '@taxilink/design-tokens'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors,
      fontFamily,
      fontSize,
      boxShadow: shadows,
      borderRadius,
      animation,
      keyframes,
    },
  },
  plugins: [],
}

export default config
