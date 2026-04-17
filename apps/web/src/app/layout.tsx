import type { Metadata, Viewport } from 'next'
import { Inter, Instrument_Serif } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800', '900'],
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
  weight: '400',
  style: ['normal', 'italic'],
})

const BASE_URL = 'https://taxilink.fr'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: { default: 'TaxiLink Pro', template: '%s | TaxiLink Pro' },
  description: 'La plateforme N°1 des chauffeurs professionnels. Gérez vos missions, votre agenda et vos revenus en temps réel. Agréé CPAM, clients privés et VTC.',
  keywords: ['taxi', 'VTC', 'chauffeur professionnel', 'CPAM', 'application chauffeur', 'mission taxi', 'TaxiLink'],
  authors: [{ name: 'TaxiLink Pro', url: BASE_URL }],
  creator: 'TaxiLink Pro',
  publisher: 'TaxiLink Pro',
  manifest: '/manifest.json',
  alternates: { canonical: BASE_URL },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'TaxiLink Pro' },
  formatDetection: { telephone: false },
  icons: { apple: '/icons/apple-touch-icon.png' },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: BASE_URL,
    siteName: 'TaxiLink Pro',
    title: 'TaxiLink Pro — La plateforme N°1 des chauffeurs professionnels',
    description: 'Gérez vos missions CPAM, clients privés et VTC en temps réel. Agenda, revenus et paiements automatiques. Rejoignez +2 400 chauffeurs actifs.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TaxiLink Pro — Application chauffeur professionnel',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaxiLink Pro — La plateforme N°1 des chauffeurs professionnels',
    description: 'Gérez vos missions CPAM, clients privés et VTC en temps réel.',
    images: ['/og-image.png'],
    creator: '@taxilink_pro',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large', 'max-video-preview': -1 },
  },
}

export const viewport: Viewport = {
  themeColor: '#FFD23F',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`scroll-smooth ${inter.variable} ${instrumentSerif.variable}`}>
      <body className="font-sans antialiased bg-white text-secondary">
        {children}
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(()=>{}));
          }
        `}</Script>
      </body>
    </html>
  )
}
