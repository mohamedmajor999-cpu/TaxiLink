import type { Metadata } from 'next'
import { LandingNav }            from '@/components/site/LandingNav'
import { HeroSection }           from '@/components/site/HeroSection'
import { ProblemSolutionSection } from '@/components/site/ProblemSolutionSection'
import { FeaturesSection }       from '@/components/site/FeaturesSection'
import { PricingSection }        from '@/components/site/PricingSection'
import { FaqSection }            from '@/components/site/FaqSection'
import { LandingFooter }         from '@/components/site/LandingFooter'
import { JsonLd }                from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'TaxiLink Pro — Fini WhatsApp. Échangez vos courses entre chauffeurs.',
  description: 'Postez une course à la voix en 30 secondes. Un collègue l\'accepte en un geste. 100% gratuit, zéro commission, données hébergées en France.',
  robots: { index: true, follow: true },
}

export default function Home() {
  return (
    <main>
      <JsonLd />
      <LandingNav />
      <HeroSection />
      <ProblemSolutionSection />
      <FeaturesSection />
      <PricingSection />
      <FaqSection />
      <LandingFooter />
    </main>
  )
}
