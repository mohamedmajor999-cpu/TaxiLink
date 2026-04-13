import type { Metadata } from 'next'
import { Navbar } from '@/components/site/Navbar'

export const metadata: Metadata = {
  title: 'TaxiLink Pro — La plateforme des chauffeurs professionnels',
  description: 'Gérez vos missions, votre agenda et vos revenus en un seul endroit. Rejoignez +2 400 chauffeurs de taxi et VTC sur TaxiLink Pro.',
  robots: { index: true, follow: true },
}
import { Hero } from '@/components/site/Hero'
import { ProblemeSection } from '@/components/site/ProblemeSection'
import { Features } from '@/components/site/Features'
import { PatronSection } from '@/components/site/PatronSection'
import { GratuitSection } from '@/components/site/GratuitSection'
import { Footer } from '@/components/site/Footer'
import { JsonLd } from '@/components/JsonLd'

export default function Home() {
  return (
    <main className="min-h-screen">
      <JsonLd />
      <Navbar />
      <Hero />
      <ProblemeSection />
      <Features />
      <PatronSection />
      <GratuitSection />
      <Footer />
    </main>
  )
}
