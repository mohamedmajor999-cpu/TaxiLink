import { OnboardingPage } from '@/components/onboarding/OnboardingPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bienvenue sur TaxiLink Pro',
  description: 'Découvrez comment TaxiLink vous permet d\'échanger des courses entre chauffeurs en 30 secondes, sans WhatsApp.',
}

export default function Onboarding() {
  return <OnboardingPage />
}
