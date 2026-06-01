import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type OnboardingStep = 'splash' | 'slide1' | 'slide2' | 'slide3' | 'welcome';

export const ONBOARDING_STORAGE_KEY = 'taxilink.onboarding.seen';
const SLIDES: OnboardingStep[] = ['slide1', 'slide2', 'slide3'];

export function useOnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>('splash');

  const next = useCallback(() => {
    setStep((s) => {
      if (s === 'splash') return 'slide1';
      const idx = SLIDES.indexOf(s as OnboardingStep);
      if (idx >= 0 && idx < SLIDES.length - 1) return SLIDES[idx + 1];
      return 'welcome';
    });
  }, []);

  const skip = useCallback(() => setStep('welcome'), []);

  const markSeen = useCallback(async () => {
    try { await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, '1'); } catch { /* ignore */ }
  }, []);

  // Marque "seen" dès qu'on atteint Welcome (pas seulement au clic CTA). Sans
  // ça, fermer l'app au welcome ferait rejouer l'onboarding au prochain boot.
  useEffect(() => {
    if (step === 'welcome') void markSeen();
  }, [step, markSeen]);

  const slideIndex = SLIDES.indexOf(step as OnboardingStep);

  return { step, slideIndex, totalSlides: SLIDES.length, next, skip, markSeen };
}
