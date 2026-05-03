import type { Metadata } from 'next'
import { LandingNav }            from '@/components/site/LandingNav'
import { HeroSection }           from '@/components/site/HeroSection'
import { ProblemSolutionSection } from '@/components/site/ProblemSolutionSection'
import { FeaturesSection }       from '@/components/site/FeaturesSection'
import { InstallSection }        from '@/components/site/InstallSection'
import { PricingSection }        from '@/components/site/PricingSection'
import { FaqSection }            from '@/components/site/FaqSection'
import { LandingFooter }         from '@/components/site/LandingFooter'
import { MobileStickyCta }       from '@/components/site/MobileStickyCta'
import { PwaFirstLaunchGate }    from '@/components/site/PwaFirstLaunchGate'
import { JsonLd }                from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'TaxiLink Pro — Fini WhatsApp. Échangez vos courses entre chauffeurs.',
  description: 'Postez une course à la voix en 30 secondes. Un collègue l\'accepte en un geste. 100% gratuit, zéro commission, données hébergées en France.',
  robots: { index: true, follow: true },
}

// La classe pwa-hide masque tout le bloc landing quand l'app est ouverte en
// mode PWA installee (cf. @media display-mode: standalone dans globals.css).
// Le gate client redirige ensuite vers /dashboard ou /auth/login. C'est un
// filet de securite pour les PWAs deja installees qui pointent encore sur
// "/" comme start_url ; les nouveaux installs utilisent /app (cf. manifest).
export default function Home() {
  return (
    <main>
      <PwaFirstLaunchGate />
      <JsonLd />
      <div className="pwa-hide">
        <LandingNav />
        <HeroSection />
        <ProblemSolutionSection />
        <FeaturesSection />
        <InstallSection />
        <PricingSection />
        <FaqSection />
        <LandingFooter />
        <MobileStickyCta />
      </div>
    </main>
  )
}
