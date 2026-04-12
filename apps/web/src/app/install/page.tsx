import { InstallPage } from '@/components/install/InstallPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Installer TaxiLink Pro',
  description: 'Installez TaxiLink Pro en tant qu\'application sur votre téléphone. Guide d\'installation PWA étape par étape.',
  alternates: { canonical: 'https://taxilink.fr/install' },
}

export default function Install() {
  return <InstallPage />
}
