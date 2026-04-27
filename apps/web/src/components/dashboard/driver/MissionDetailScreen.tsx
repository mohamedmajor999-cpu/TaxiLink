'use client'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Lock } from 'lucide-react'
import { RouteTimeline } from '@/components/taxilink/RouteTimeline'
import { addressAsPoint } from '@/lib/splitFrenchAddress'
import { computeDisplayFare } from '@/lib/missionFare'
import { useMissionDetail } from './course/useMissionDetail'
import { CancelMissionDialog } from './course/CancelMissionDialog'
import { CourseTopStats } from './course/CourseTopStats'
import { CourseDetailsTable } from './course/CourseDetailsTable'
import { CourseActions } from './course/CourseActions'

const CourseMap = dynamic(() => import('./course/CourseMap').then((m) => m.CourseMap), { ssr: false })

const TERMINAL_STATUSES = new Set(['DONE', 'CANCELLED'])

interface Props {
  missionId: string
  onBack?: () => void
}

export function MissionDetailScreen({ missionId, onBack }: Props) {
  const c = useMissionDetail(missionId)

  if (c.loading) return <Shell onBack={onBack}><div className="h-64 rounded-3xl bg-warm-100 motion-safe:animate-pulse mb-3" /></Shell>
  if (!c.mission) return (
    <Shell onBack={onBack}>
      <div className="rounded-2xl border border-warm-200 bg-paper p-10 text-center">
        <p className="text-[20px] font-bold text-ink mb-2">Course introuvable</p>
      </div>
    </Shell>
  )

  const mission = c.mission
  const trafficMin = c.traffic ? Math.round(c.traffic.durationSec / 60) : null
  const routeMin = c.route ? Math.round(c.route.durationSec / 60) : null
  const km = c.route ? (c.route.distanceM / 1000).toFixed(1)
    : c.traffic ? (c.traffic.distanceM / 1000).toFixed(1)
    : null
  const trafficSub = trafficMin
    ? (c.traffic?.predicted ? 'trafic prévu' : 'trafic réel')
    : routeMin ? 'hors trafic' : undefined

  const fare = computeDisplayFare({
    price_eur: mission.price_eur,
    type: mission.type,
    medical_motif: mission.medical_motif,
    distance_km: mission.distance_km ?? (c.route ? c.route.distanceM / 1000 : c.traffic ? c.traffic.distanceM / 1000 : null),
    duration_min: mission.duration_min ?? (c.traffic ? c.traffic.durationSec / 60 : c.route ? c.route.durationSec / 60 : null),
    static_duration_min: mission.static_duration_min ?? (c.traffic?.staticDurationSec != null ? c.traffic.staticDurationSec / 60 : null),
    scheduled_at: mission.scheduled_at,
    departure: mission.departure,
    destination: mission.destination,
    passengers: mission.passengers,
    transport_type: mission.transport_type,
    return_trip: mission.return_trip,
  })

  const isTerminal = TERMINAL_STATUSES.has(mission.status)

  return (
    <Shell onBack={onBack}>
      {c.isMasked && mission.type === 'CPAM' && (
        <div className="mb-3 flex items-start gap-3 rounded-2xl border border-warm-200 bg-warm-50 p-3">
          <Lock className="w-4 h-4 text-warm-600 shrink-0 mt-0.5" strokeWidth={2} />
          <p className="text-[12.5px] text-warm-700 leading-snug">
            <strong>Données patient masquées.</strong> Les coordonnées complètes
            (nom, téléphone, notes) seront visibles uniquement après acceptation de
            la course, conformément à la protection des données de santé (RGPD Art. 9).
          </p>
        </div>
      )}
      <article className="rounded-3xl border border-warm-200 bg-paper overflow-hidden shadow-soft mb-3">
        <CourseTopStats scheduledAt={mission.scheduled_at} />
        <div className="relative h-[268px] md:h-[364px] bg-warm-50">
          {c.from && c.to ? (
            <CourseMap from={c.from} to={c.to} routeGeometry={c.route?.geometry ?? null} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[13px] text-warm-500">
              Coordonnées GPS manquantes
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 border-t border-warm-200">
          <Stat label="Distance" value={km ? `${km} km` : '—'} />
          <Stat
            label="Trafic"
            value={trafficMin ? `${trafficMin} min` : routeMin ? `${routeMin} min` : '—'}
            sub={trafficSub}
            border
          />
          <Stat
            label={fare.isEstimated ? 'Prix estimé' : 'Prix'}
            value={fare.value > 0 ? `${fare.value.toFixed(0)} €` : '—'}
            border
          />
        </div>
      </article>

      <div className="rounded-2xl border border-warm-200 bg-paper p-4 mb-3">
        <RouteTimeline
          from={addressAsPoint(mission.departure)}
          to={addressAsPoint(mission.destination)}
        />
      </div>

      <CourseDetailsTable mission={mission} />

      {!isTerminal && (
        <CourseActions
          phone={mission.phone}
          smsHref={c.smsHref}
          wazeHref={c.wazeHref}
          gmapsHref={c.gmapsHref}
          onComplete={c.complete}
          onCancel={() => c.setCancelOpen(true)}
          completing={c.completing}
        />
      )}

      <CancelMissionDialog
        open={c.cancelOpen}
        submitting={c.cancelling}
        onClose={() => c.setCancelOpen(false)}
        onSubmit={c.cancel}
      />
    </Shell>
  )
}

function Shell({ children, onBack }: { children: React.ReactNode; onBack?: () => void }) {
  const router = useRouter()
  return (
    <div className="px-4 md:px-8 py-3 md:py-6 max-w-2xl md:max-w-3xl mx-auto pb-24 md:pb-6">
      <header className="mb-3">
        <button
          type="button"
          onClick={() => (onBack ? onBack() : router.back())}
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-warm-600 hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          Retour
        </button>
      </header>
      {children}
    </div>
  )
}

function Stat({ label, value, sub, border = false }: { label: string; value: string; sub?: string; border?: boolean }) {
  return (
    <div className={`px-3 py-3 text-center ${border ? 'border-l border-warm-200' : ''}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-warm-500 mb-0.5">{label}</p>
      <p className="text-[18px] md:text-[20px] font-bold text-ink tabular-nums tracking-tight leading-none">{value}</p>
      {sub && <p className="text-[10px] text-warm-500 mt-1">{sub}</p>}
    </div>
  )
}
