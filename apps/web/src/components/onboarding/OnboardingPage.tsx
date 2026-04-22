'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingSplash } from './OnboardingSplash'
import { OnboardingSlide } from './OnboardingSlide'
import { OnboardingWelcome } from './OnboardingWelcome'
import { SlideIlloLongPress } from './SlideIlloLongPress'
import { SlideIlloVoice } from './SlideIlloVoice'
import { SlideIlloRgpd } from './SlideIlloRgpd'
import { useOnboardingPage } from './useOnboardingPage'

export function OnboardingPage() {
  const router = useRouter()
  const { step, slideIndex, totalSlides, next, skip, markSeen } = useOnboardingPage()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(min-width: 768px)').matches) router.replace('/')
  }, [router])

  if (step === 'splash') return <OnboardingSplash />

  if (step === 'welcome') return <OnboardingWelcome onEnter={markSeen} />

  if (step === 'slide1') {
    return (
      <OnboardingSlide
        variant="light"
        title="Prenez des courses en 3 secondes."
        lead="Appuyez longuement sur une course. Elle est à vous. Plus de surenchère, plus de désordre dans le groupe WhatsApp."
        illo={<SlideIlloLongPress />}
        stepIdx={slideIndex}
        total={totalSlides}
        onNext={next}
        onSkip={skip}
      />
    )
  }

  if (step === 'slide2') {
    return (
      <OnboardingSlide
        variant="light"
        title="Dictez, ne tapez plus."
        lead="Publiez une course en 30 secondes sans lâcher le volant. L'IA comprend le jargon chauffeur."
        illo={<SlideIlloVoice />}
        stepIdx={slideIndex}
        total={totalSlides}
        onNext={next}
        onSkip={skip}
      />
    )
  }

  return (
    <OnboardingSlide
      variant="dark"
      title={<>100% RGPD.<br />Données en France.</>}
      lead="Hébergement souverain. Codes d'invitation expirants, données pseudonymisées."
      illo={<SlideIlloRgpd />}
      stepIdx={slideIndex}
      total={totalSlides}
      onNext={next}
      onSkip={skip}
      nextLabel="Commencer"
    />
  )
}
