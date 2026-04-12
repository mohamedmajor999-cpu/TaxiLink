import { DownloadPage } from '@/components/install/DownloadPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Télécharger TaxiLink Pro',
  description: 'Installez TaxiLink Pro sur iOS et Android. Application PWA gratuite pour chauffeurs de taxi et VTC.',
  alternates: { canonical: 'https://taxilink.fr/telecharger' },
  openGraph: {
    title: 'Télécharger TaxiLink Pro — App chauffeur iOS & Android',
    description: 'Installez TaxiLink Pro gratuitement sur votre téléphone. Disponible sur iOS et Android.',
    url: 'https://taxilink.fr/telecharger',
  },
}

export default function Telecharger() {
  return <DownloadPage />
}
