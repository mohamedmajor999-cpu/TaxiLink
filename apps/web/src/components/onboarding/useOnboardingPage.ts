import { useCallback, useEffect, useState } from 'react'

export type OnboardingStep = 'splash' | 'slide1' | 'slide2' | 'slide3' | 'welcome'

const STORAGE_KEY = 'taxilink.onboarding.seen'
const SLIDES: OnboardingStep[] = ['slide1', 'slide2', 'slide3']

export function useOnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>('splash')

  useEffect(() => {
    const t = setTimeout(() => setStep('slide1'), 1600)
    return () => clearTimeout(t)
  }, [])

  const next = useCallback(() => {
    setStep((s) => {
      if (s === 'splash') return 'slide1'
      const idx = SLIDES.indexOf(s as OnboardingStep)
      if (idx >= 0 && idx < SLIDES.length - 1) return SLIDES[idx + 1]
      return 'welcome'
    })
  }, [])

  const prev = useCallback(() => {
    setStep((s) => {
      const idx = SLIDES.indexOf(s as OnboardingStep)
      if (idx > 0) return SLIDES[idx - 1]
      if (s === 'welcome') return 'slide3'
      return s
    })
  }, [])

  const skip = useCallback(() => setStep('welcome'), [])

  const markSeen = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
  }, [])

  const slideIndex = SLIDES.indexOf(step as OnboardingStep)

  return { step, slideIndex, totalSlides: SLIDES.length, next, prev, skip, markSeen }
}

export function hasSeenOnboarding() {
  try { return localStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
}
