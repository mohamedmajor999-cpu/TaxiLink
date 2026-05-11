// Animations Tailwind (keyframes + raccourcis `animate-*`). Web only.
// Sur mobile, ces effets sont a reimplementer avec Reanimated 3.

export const animation = {
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
} as const

export const keyframes = {
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
    '50%': { transform: 'translateY(-10px) rotate(-1deg)' },
  },
  floatB: {
    '0%, 100%': { transform: 'translateY(0) rotate(0.8deg)' },
    '50%': { transform: 'translateY(-8px) rotate(0.8deg)' },
  },
  floatC: {
    '0%, 100%': { transform: 'translateY(0) rotate(1.2deg)' },
    '50%': { transform: 'translateY(-12px) rotate(1.2deg)' },
  },
  floatD: {
    '0%, 100%': { transform: 'translateY(0) rotate(-0.6deg)' },
    '50%': { transform: 'translateY(-7px) rotate(-0.6deg)' },
  },
  micPulse: {
    '0%, 100%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.08)' },
  },
  micRing: {
    '0%': { transform: 'scale(1)', opacity: '0.55' },
    '100%': { transform: 'scale(1.9)', opacity: '0' },
  },
  voiceBar: {
    '0%, 100%': { transform: 'scaleY(0.35)' },
    '50%': { transform: 'scaleY(1)' },
  },
  popIn: {
    '0%': { transform: 'scale(0.4)', opacity: '0' },
    '70%': { transform: 'scale(1.15)', opacity: '1' },
    '100%': { transform: 'scale(1)', opacity: '1' },
  },
} as const

export type AnimationTokens = typeof animation
export type KeyframeTokens = typeof keyframes
