'use client'
import { Phone, Mail, Navigation2, Crosshair } from 'lucide-react'
import { RouteTimeline } from '@/components/taxilink/RouteTimeline'
import { useMissionStore } from '@/store/missionStore'

export function CurrentCourseScreen() {
  const currentMission = useMissionStore((s) => s.currentMission)
  const gmapsDestination = currentMission?.destination ?? 'Chemin des Bourrely, 13015'
  const gmapsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(gmapsDestination)}&travelmode=driving`

  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-2xl md:max-w-3xl mx-auto pb-24 md:pb-6">
      <header className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 md:w-10 md:h-10 bg-ink rounded-lg flex items-center justify-center shrink-0">
            <div className="w-3 h-3 md:w-3.5 md:h-3.5 bg-brand rounded-sm" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[18px] md:text-[22px] font-bold text-ink leading-tight tracking-tight">
              Course en cours
            </h1>
            <p className="text-[12px] md:text-[13px] text-warm-500 mt-0.5 truncate">
              De Pascal M. · Taxi13
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink text-paper text-[12px] font-semibold shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-brand" />
          En route
        </span>
      </header>

      <article className="rounded-3xl border border-warm-200 bg-paper overflow-hidden shadow-soft mb-4">
        <div className="relative h-64 md:h-80 bg-warm-50">
          <MapPlaceholder />
          <button
            type="button"
            aria-label="Centrer sur ma position"
            className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-paper shadow-card flex items-center justify-center text-ink hover:bg-warm-50 transition-colors"
          >
            <Crosshair className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>

        <div className="grid grid-cols-3 border-t border-warm-200">
          <Stat label="Distance" value="4,2 km" />
          <Stat label="Temps" value="12 min" border />
          <Stat label="Arrivée" value="16h42" border />
        </div>
      </article>

      <div className="rounded-2xl border border-warm-200 bg-paper p-5 mb-4">
        <RouteTimeline
          from={{ name: 'La Belle de Mai', address: '41 rue Jobin, 13003' }}
          to={{ name: 'Hôpital Nord', address: 'Chemin des Bourrely, 13015' }}
        />
      </div>

      <div className="rounded-2xl bg-warm-50 border border-warm-200 p-5 mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-warm-500 mb-1">
            À encaisser · CPAM
          </p>
          <p className="text-[28px] font-bold text-ink tabular-nums tracking-tight leading-none">
            45€
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="tel:+33"
            aria-label="Appeler le patient"
            className="w-11 h-11 rounded-xl bg-ink text-brand flex items-center justify-center hover:bg-warm-800 transition-colors"
          >
            <Phone className="w-4 h-4" strokeWidth={2} />
          </a>
          <button
            type="button"
            aria-label="Envoyer un message"
            className="w-11 h-11 rounded-xl border border-warm-300 bg-paper text-ink flex items-center justify-center hover:bg-warm-50 transition-colors"
          >
            <Mail className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <a
        href={gmapsHref}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full h-14 rounded-2xl bg-ink text-paper text-[15px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-warm-800 transition-colors mb-3"
      >
        <span className="w-5 h-5 rotate-45 bg-brand flex items-center justify-center rounded-sm">
          <Navigation2 className="w-3 h-3 text-ink -rotate-45" strokeWidth={2.2} />
        </span>
        Ouvrir dans Google Maps
      </a>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="h-12 rounded-xl border border-warm-300 bg-paper text-ink text-[13px] font-semibold hover:bg-warm-50 transition-colors"
        >
          J&apos;arrive sur place
        </button>
        <button
          type="button"
          className="h-12 rounded-xl border border-warm-300 bg-paper text-danger text-[13px] font-semibold hover:bg-danger-soft transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value, border = false }: { label: string; value: string; border?: boolean }) {
  return (
    <div className={`p-4 ${border ? 'border-l border-warm-200' : ''}`}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-warm-500 mb-1">
        {label}
      </p>
      <p className="text-[22px] font-bold text-ink tabular-nums tracking-tight leading-none">
        {value}
      </p>
    </div>
  )
}

function MapPlaceholder() {
  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <rect width="400" height="240" fill="#F7F5EF" />
      <path d="M0 60 Q200 40 400 80" stroke="#E8E6DF" strokeWidth="18" fill="none" strokeLinecap="round" />
      <path d="M0 180 Q200 200 400 160" stroke="#E8E6DF" strokeWidth="14" fill="none" strokeLinecap="round" />
      <path d="M80 0 Q100 120 70 240" stroke="#E8E6DF" strokeWidth="16" fill="none" strokeLinecap="round" />
      <path d="M300 0 Q280 120 320 240" stroke="#E8E6DF" strokeWidth="14" fill="none" strokeLinecap="round" />
      <path d="M120 170 L340 60" stroke="#0A0A0A" strokeWidth="3" strokeDasharray="6 6" fill="none" strokeLinecap="round" />
      <circle cx="120" cy="170" r="12" fill="#F1EFE8" />
      <circle cx="120" cy="170" r="6" fill="#FFD11A" />
      <circle cx="340" cy="60" r="14" fill="#FFD11A" />
      <path d="M334 58 L339 63 L347 52" stroke="#0A0A0A" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
