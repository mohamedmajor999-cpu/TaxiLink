import type { Metadata, Viewport } from 'next'
import { InviteJoinCard } from '@/components/invite/InviteJoinCard'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params: _params }: Props): Promise<Metadata> {
  const title = 'Rejoindre un groupe sur TaxiLink Pro'
  const description = 'TaxiLink Pro — la plateforme de partage de courses entre taxis. Tu as été invité(e) à rejoindre un groupe, clique pour accepter.'
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      type: 'website',
      siteName: 'TaxiLink Pro',
      title,
      description,
      images: [
        {
          url: '/icons/icon-512.png',
          width: 512,
          height: 512,
          alt: 'TaxiLink Pro',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/icons/icon-512.png'],
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#FFD11A',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RejoindrePage({ params }: Props) {
  return <InviteJoinCard groupId={params.id} />
}
