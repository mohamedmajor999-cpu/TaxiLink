import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { fetchPublicMission } from '@/lib/publicMission'
import { formatMissionPrice } from '@/lib/formatMissionPrice'

interface Props {
  params: { id: string }
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long',
    hour: '2-digit', minute: '2-digit',
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = await fetchPublicMission(params.id)
  if (!m) return { title: 'Course introuvable · TaxiLink' }
  const price = formatMissionPrice(m)
  const title = `Course taxi ${price} : ${m.departure} → ${m.destination}`
  const description = `${formatDateTime(m.scheduled_at)} · ${m.type === 'CPAM' ? 'CPAM' : 'Privé'}${m.return_trip ? ' · Aller-retour' : ''}`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'TaxiLink',
      images: [{ url: `/api/og/c/${m.id}`, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [`/api/og/c/${m.id}`] },
  }
}

export default async function PublicMissionPage({ params }: Props) {
  const m = await fetchPublicMission(params.id)
  if (!m) notFound()
  const isCpam = m.type === 'CPAM'
  const price = formatMissionPrice(m)
  const date = formatDateTime(m.scheduled_at)
  const isAvailable = m.status === 'AVAILABLE'

  return (
    <main className="min-h-[100dvh] bg-warm-50 flex flex-col">
      <header className="px-6 pt-8 pb-4 flex items-center justify-between max-w-2xl w-full mx-auto">
        <Link href="/" className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">
          Taxi<span className="text-[#FFD11A]">·</span>Link
        </Link>
        <Link href="/auth/login" className="text-[12.5px] font-bold text-ink hover:underline">
          Se connecter →
        </Link>
      </header>

      <section className="flex-1 px-6 pb-10 max-w-2xl w-full mx-auto">
        <div className="mt-6 mb-4 inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-warm-500">
          <span className={`inline-flex w-2 h-2 rounded-full ${isAvailable ? 'bg-[#16A34A]' : 'bg-warm-400'}`} />
          {isAvailable ? 'Course disponible' : 'Course déjà prise'}
        </div>

        <h1 className="text-[32px] sm:text-[40px] font-extrabold tracking-[-0.025em] leading-[1.05] text-ink">
          {m.departure}
          <br />
          <span className="text-warm-400">vers</span>
          <br />
          {m.destination}
        </h1>

        <div className="mt-8 rounded-3xl bg-paper border border-warm-200 p-6 shadow-[0_8px_28px_-12px_rgba(0,0,0,0.10)]">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[10.5px] font-bold tracking-[0.12em] uppercase text-warm-400">Prix de la course</div>
              <div className="text-[44px] font-extrabold tracking-[-0.035em] leading-[0.95] mt-1 text-ink">{price}</div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-[0.04em] ${
                isCpam ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-warm-100 text-ink'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isCpam ? 'bg-[#DC2626]' : 'bg-ink'}`} />
              {isCpam ? 'CPAM' : 'Privé'}
              {m.return_trip ? ' · A/R' : ''}
            </span>
          </div>

          <div className="mt-5 pt-5 border-t border-warm-200 grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10.5px] font-bold tracking-[0.12em] uppercase text-warm-400">Quand</div>
              <div className="text-[14px] font-bold text-ink mt-1 capitalize">{date}</div>
            </div>
            <div>
              <div className="text-[10.5px] font-bold tracking-[0.12em] uppercase text-warm-400">Distance</div>
              <div className="text-[14px] font-bold text-ink mt-1">
                {m.distance_km != null ? `${m.distance_km.toFixed(1).replace('.', ',')} km` : '—'}
                {m.duration_min != null && <span className="text-warm-500 font-medium"> · {Math.round(m.duration_min)} min</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl bg-ink text-paper p-6 text-center">
          <p className="text-[14px] leading-relaxed">
            Cette course a été postée sur <span className="font-extrabold text-[#FFD11A]">TaxiLink</span>,
            la plateforme qui met en relation chauffeurs de taxi et patients en France.
          </p>
          <Link
            href="/auth/login"
            className="mt-4 inline-flex items-center justify-center gap-2 h-12 px-6 bg-[#FFD11A] text-ink rounded-2xl font-extrabold text-[14px] hover:scale-[1.02] transition-transform"
          >
            Rejoindre TaxiLink
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <p className="mt-6 text-center text-[11px] text-warm-500">
          Course #{m.id.slice(0, 8)} · Les coordonnées du client ne sont visibles qu&apos;aux chauffeurs connectés.
        </p>
      </section>
    </main>
  )
}
