import { Navbar } from '@/components/site/Navbar'
import { Hero } from '@/components/site/Hero'
import { Stats } from '@/components/site/Stats'
import { HowItWorks } from '@/components/site/HowItWorks'
import { Features } from '@/components/site/Features'
import { Testimonials } from '@/components/site/Testimonials'
import { DownloadSection } from '@/components/site/DownloadSection'
import { Footer } from '@/components/site/Footer'
import { JsonLd } from '@/components/JsonLd'

export default function Home() {
  return (
    <main className="min-h-screen">
      <JsonLd />
      <Navbar />
      <Hero />
      <Stats />
      <HowItWorks />
      <Features />
      <Testimonials />
      <DownloadSection />
      <Footer />
    </main>
  )
}
