import { Navbar } from '@/components/site/Navbar'
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
