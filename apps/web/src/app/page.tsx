import type { Metadata } from 'next'
import { LandingNav }          from '@/components/site/LandingNav'
import { HeroSection }         from '@/components/site/HeroSection'
import { FeaturesSection }     from '@/components/site/FeaturesSection'
import { HowItWorksSection }   from '@/components/site/HowItWorksSection'
import { TestimonialSection }  from '@/components/site/TestimonialSection'
import { PricingSection }      from '@/components/site/PricingSection'
import { CtaSection }          from '@/components/site/CtaSection'
import { LandingFooter }       from '@/components/site/LandingFooter'
import { JsonLd }              from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'TaxiLink — Échangez vos courses entre chauffeurs pros',
  description: 'Postez une course médicale ou privée à la voix en 30 secondes. Un collègue la récupère, vous êtes notifié. Sans appel. Sans WhatsApp.',
  robots: { index: true, follow: true },
}

export default function Home() {
  return (
    <main>
      <JsonLd />
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialSection />
      <PricingSection />
      <CtaSection />
      <LandingFooter />
    </main>
  )
}
