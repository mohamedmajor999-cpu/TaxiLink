import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
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

function getBaseUrl(): string {
  const h = headers()
  const host = h.get('host') ?? 'taxi-link-web.vercel.app'
  const protocol = host.startsWith('localhost') ? 'http' : 'https'
  return `${protocol}://${host}`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = await fetchPublicMission(params.id)
  const baseUrl = getBaseUrl()
  if (!m) {
    return { title: 'Course introuvable · TaxiLink', metadataBase: new URL(baseUrl) }
  }
  const price = formatMissionPrice(m)
  const title = `Course taxi ${price} · ${m.departure} → ${m.destination}`
  const description = `${formatDateTime(m.scheduled_at)} · ${m.type === 'CPAM' ? 'CPAM' : 'Privé'}${m.return_trip ? ' · Aller-retour' : ''}`
  const ogUrl = `${baseUrl}/api/og/c/${m.id}`
  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'TaxiLink',
      url: `${baseUrl}/c/${m.id}`,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: title, type: 'image/png' }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogUrl] },
  }
}

export default async function PublicMissionPage({ params }: Props) {
  const m = await fetchPublicMission(params.id)
  if (!m) notFound()
  const isCpam = m.type === 'CPAM'
  const price = formatMissionPrice(m, { decimals: true })
  const date = formatDateTime(m.scheduled_at)
  const isAvailable = m.status === 'AVAILABLE'

  return (
    <main className="min-h-[100dvh] bg-warm-50 flex flex-col">
      <header className="px-6 pt-7 pb-4 flex items-center justify-between max-w-2xl w-full mx-auto">
        <Link href="/" className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">
          Taxi<span className="text-[#FFD11A]">·</span>Link
        </Link>
        <Link href="/auth/login" className="text-[12.5px] font-bold text-ink hover:underline">
          Se connecter
        </Link>
      </header>

      <section className="flex-1 px-6 pb-10 max-w-2xl w-full mx-auto">
        <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-warm-500 inline-flex items-center gap-2">
          <span className={`inline-flex w-2 h-2 rounded-full ${isAvailable ? 'bg-[#16A34A]' : 'bg-warm-400'}`} />
          {isAvailable ? 'Course disponible' : 'Course déjà prise'}
        </p>

        <h1 className="mt-3 text-[28px] sm:text-[34px] font-extrabold tracking-[-0.025em] leading-[1.1] text-ink">
          Une course taxi vient d&apos;être publiée sur TaxiLink
        </h1>

        {/* Carte mission — meme look que sur le dashboard */}
        <article className="mt-6 bg-paper rounded-3xl shadow-[0_8px_28px_-12px_rgba(0,0,0,0.12)] border border-warm-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4 gap-3">
              <span
                className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-[0.05em] ${
                  isCpam ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#F3E8FF] text-[#6B21A8]'
                }`}
              >
                {isCpam ? 'CPAM' : 'Privé'}{m.return_trip ? ' · A/R' : ''}
              </span>
              <div className="flex items-center gap-1.5 text-[12px] font-bold text-warm-600">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                {date}
              </div>
            </div>

            {/* Itinéraire avec timeline départ→arrivée */}
            <div className="flex items-start gap-3.5 mb-5">
              <div className="flex flex-col items-center gap-1.5 pt-1.5 flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-ink" />
                <div className="w-0.5 h-7 bg-warm-200" />
                <div className="w-3 h-3 rounded-full bg-[#FFD11A] border-[2.5px] border-ink" />
              </div>
              <div className="space-y-3 min-w-0 flex-1">
                <p className="text-[15px] font-bold text-ink leading-tight break-words">{m.departure}</p>
                <p className="text-[15px] font-bold text-warm-700 leading-tight break-words">{m.destination}</p>
              </div>
            </div>

            <div className="flex items-end justify-between pt-4 border-t border-warm-200">
              <div>
                <p className="text-[10.5px] font-bold tracking-[0.12em] uppercase text-warm-400">Prix</p>
                <p className="text-[36px] font-extrabold tracking-[-0.03em] leading-[0.95] text-ink mt-1">{price}</p>
              </div>
              <div className="text-right">
                <p className="text-[10.5px] font-bold tracking-[0.12em] uppercase text-warm-400">Distance</p>
                <p className="text-[14px] font-bold text-ink mt-1">
                  {m.distance_km != null ? `${m.distance_km.toFixed(1).replace('.', ',')} km` : '—'}
                  {m.duration_min != null && <span className="text-warm-500 font-medium"> · {Math.round(m.duration_min)} min</span>}
                </p>
              </div>
            </div>
          </div>
        </article>

        <div className="mt-7 rounded-2xl bg-ink text-paper p-6 text-center">
          <p className="text-[14px] leading-relaxed">
            Inscris-toi sur <span className="font-extrabold text-[#FFD11A]">TaxiLink</span> pour
            voir le client, accepter la course et toucher la totalité du prix.
          </p>
          <Link
            href="/auth/register"
            className="mt-4 inline-flex items-center justify-center gap-2 h-12 px-6 bg-[#FFD11A] text-ink rounded-2xl font-extrabold text-[14px] hover:scale-[1.02] transition-transform"
          >
            S&apos;inscrire — c&apos;est gratuit
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <p className="mt-5 text-center text-[11px] text-warm-500">
          Course #{m.id.slice(0, 8)} · Coordonnées du client visibles uniquement aux chauffeurs connectés.
        </p>
      </section>
    </main>
  )
}
