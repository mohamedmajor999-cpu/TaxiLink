import { OnboardingPage } from '@/components/onboarding/OnboardingPage'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Bienvenue sur TaxiLink Pro',
  description: 'Découvrez en 3 étapes comment échanger vos courses entre chauffeurs — appui long, dictée vocale, données en France.',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#FFD11A',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function Onboarding() {
  return <OnboardingPage />
}
