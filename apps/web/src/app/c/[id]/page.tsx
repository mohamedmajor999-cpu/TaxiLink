import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import type { Metadata } from 'next'
import { fetchPublicMission, fetchDriverCount } from '@/services/publicMissionService'
import { computeDisplayFare } from '@/lib/missionFare'
import { PublicMissionCard } from '@/components/public/PublicMissionCard'

interface Props {
  params: { id: string }
}

function shortLoc(s: string): string {
  return s.split(',')[0].trim() || s
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatPrice(value: number): string {
  return `${value.toFixed(2).replace('.', ',')} €`
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
  if (!m) return { title: 'Course introuvable · TaxiLink', metadataBase: new URL(baseUrl) }
  const fare = computeDisplayFare(m)
  const priceLabel = fare.value > 0 ? formatPrice(fare.value) : ''
  const title = priceLabel
    ? `Course taxi ${priceLabel} · ${shortLoc(m.departure)} → ${shortLoc(m.destination)}`
    : `Course taxi · ${shortLoc(m.departure)} → ${shortLoc(m.destination)}`
  const description = `${formatDateTime(m.scheduled_at)} · ${m.type === 'CPAM' ? 'CPAM' : 'Privé'}${m.return_trip ? ' · Aller-retour' : ''}`
  const ogUrl = `${baseUrl}/api/og/c/${m.id}`
  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    openGraph: {
      title, description, type: 'website', siteName: 'TaxiLink',
      url: `${baseUrl}/c/${m.id}`,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: title, type: 'image/png' }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogUrl] },
  }
}

export default async function PublicMissionPage({ params }: Props) {
  const [m, driverCount] = await Promise.all([
    fetchPublicMission(params.id),
    fetchDriverCount(),
  ])
  if (!m) notFound()
  const isAvailable = m.status === 'AVAILABLE'
  const fare = computeDisplayFare(m)

  return (
    <main className="min-h-[100dvh] bg-paper">
      <div className="max-w-md mx-auto px-5 pt-5 pb-10">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">
            Taxi<span className="text-[#FFD11A]">·</span>Link
          </Link>
          <Link href="/auth/login" className="text-[12.5px] font-bold text-ink">Se connecter</Link>
        </header>

        <div className="mt-7 inline-flex items-center gap-2">
          <span className="relative flex w-2.5 h-2.5">
            {isAvailable && <span className="absolute inset-0 rounded-full bg-[#16A34A] motion-safe:animate-ping opacity-60" />}
            <span className={`relative inline-flex rounded-full w-2.5 h-2.5 ${isAvailable ? 'bg-[#16A34A]' : 'bg-warm-400'}`} />
          </span>
          <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-warm-600">
            {isAvailable ? 'Course disponible' : 'Course déjà prise'}
          </span>
        </div>

        <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.03em] leading-[1.05] text-ink">
          {shortLoc(m.departure)}<br />
          <span className="text-warm-400">→</span> {shortLoc(m.destination)}
        </h1>
        <p className="mt-3 text-[14px] font-bold text-warm-600 capitalize">{formatDateTime(m.scheduled_at)}</p>

        <PublicMissionCard mission={m} fareValue={fare.value} />

        <h2 className="mt-8 text-[16px] font-extrabold tracking-[-0.015em] text-ink">Pour la prendre, inscris-toi.</h2>
        <div className="mt-3 space-y-2">
          <Benefit color="brand" text="100 % du prix pour toi" sub="Aucune commission" icon="€" />
          <Benefit color="ink" text="Notification directe" sub="Avant tous les autres" icon="bolt" />
          <Benefit color="red" text="CPAM réglée" sub="Bordereau prêt, paperasse en moins" icon="cross" />
        </div>

        <Link href="/auth/register" className="mt-7 w-full h-14 bg-ink text-paper rounded-2xl font-extrabold text-[15px] flex items-center justify-center gap-2 shadow-[0_12px_28px_-8px_rgba(0,0,0,0.45)]">
          Créer mon compte
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#FFD11A" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </Link>
        <Link href="/auth/login" className="mt-2.5 block text-center text-[12.5px] font-bold text-warm-600">
          J&apos;ai déjà un compte → me connecter
        </Link>

        <div className="mt-7 pt-5 border-t border-warm-200 text-center">
          <p className="text-[11px] text-warm-500">
            <span className="font-extrabold text-ink">+ {driverCount}</span> chauffeurs ·
            <span className="font-extrabold text-ink"> 100 %</span> du prix ·
            <span className="font-extrabold text-ink"> 0</span> abonnement
          </p>
        </div>
      </div>
    </main>
  )
}

function Benefit({ color, text, sub, icon }: { color: 'brand' | 'ink' | 'red'; text: string; sub: string; icon: 'bolt' | '€' | 'cross' }) {
  const bg = color === 'brand' ? 'bg-[#FFD11A]' : color === 'ink' ? 'bg-ink' : 'bg-[#DC2626]'
  const fg = color === 'brand' ? 'text-ink' : 'text-paper'
  return (
    <div className="flex items-center gap-3 bg-paper border border-warm-200 rounded-xl p-3">
      <div className={`w-9 h-9 rounded-lg ${bg} ${fg} flex items-center justify-center flex-shrink-0`}>
        {icon === '€' && <span className="text-[16px] font-extrabold">€</span>}
        {icon === 'bolt' && <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h7v8l10-12h-7z" /></svg>}
        {icon === 'cross' && <svg viewBox="0 0 16 16" width="13" height="13"><path d="M5 1.5h2v3h3v2H7v3H5v-3H2v-2h3v-3z" fill="currentColor" /></svg>}
      </div>
      <div className="min-w-0">
        <p className="text-[13.5px] font-extrabold leading-tight text-ink">{text}</p>
        <p className="text-[11.5px] text-warm-600 leading-tight mt-0.5">{sub}</p>
      </div>
    </div>
  )
}
