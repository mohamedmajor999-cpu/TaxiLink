'use client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { RouteTimeline } from '@/components/taxilink/RouteTimeline'
import { addressAsPoint } from '@/lib/splitFrenchAddress'
import { useCurrentCourse } from './course/useCurrentCourse'
import { CancelMissionDialog } from './course/CancelMissionDialog'
import { NavigationButtons } from './course/NavigationButtons'
import { CourseScheduleBlock } from './course/CourseScheduleBlock'
import { CourseInfoBlock } from './course/CourseInfoBlock'
import { CoursePassengerBlock } from './course/CoursePassengerBlock'
import { CourseSharedByBlock } from './course/CourseSharedByBlock'
import { CoursePriceBlock } from './course/CoursePriceBlock'
import { CourseActions } from './course/CourseActions'
import { computeEta } from './course/scheduleDisplay'

const CourseMap = dynamic(() => import('./course/CourseMap').then((m) => m.CourseMap), { ssr: false })

interface Props {
  onBack?: () => void
}

export function CurrentCourseScreen({ onBack }: Props = {}) {
  const c = useCurrentCourse()

  if (c.loading) return <LoadingSkeleton onBack={onBack} />
  if (!c.mission) return <NoCurrentMission onBack={onBack} />

  const mission = c.mission
  const trafficMin = c.traffic ? Math.round(c.traffic.durationSec / 60) : null
  const routeMin = c.route ? Math.round(c.route.durationSec / 60) : null
  const km = c.route ? (c.route.distanceM / 1000).toFixed(1)
    : c.traffic ? (c.traffic.distanceM / 1000).toFixed(1)
    : null

  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-2xl md:max-w-3xl mx-auto pb-24 md:pb-6">
      <header className="flex items-center justify-between gap-3 mb-4">
        <BackButton onBack={onBack} />
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink text-paper text-[12px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-brand motion-safe:animate-pulse" />
          Course en cours
        </span>
      </header>

      <CourseScheduleBlock scheduledAt={mission.scheduled_at} returnTime={mission.return_trip ? mission.return_time : null} />

      <article className="rounded-3xl border border-warm-200 bg-paper overflow-hidden shadow-soft mb-4">
        <div className="relative h-64 md:h-80 bg-warm-50">
          {c.from && c.to ? (
            <CourseMap from={c.from} to={c.to} routeGeometry={c.route?.geometry ?? null} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[13px] text-warm-500">
              Coordonnées GPS manquantes pour cette course
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 border-t border-warm-200">
          <Stat label="Distance" value={km ? `${km} km` : '—'} />
          <Stat
            label="Temps"
            value={trafficMin ? `${trafficMin} min` : routeMin ? `${routeMin} min` : '—'}
            sub={trafficMin ? (c.traffic?.predicted ? 'trafic prévu' : 'trafic réel') : routeMin ? 'hors trafic' : undefined}
            border
          />
          <Stat
            label="Arrivée"
            value={computeEta(mission.scheduled_at, c.traffic?.durationSec ?? c.route?.durationSec ?? null)}
            border
          />
        </div>
      </article>

      <div className="rounded-2xl border border-warm-200 bg-paper p-5 mb-4">
        <RouteTimeline
          from={addressAsPoint(mission.departure)}
          to={addressAsPoint(mission.destination)}
        />
      </div>

      <CourseInfoBlock
        type={mission.type}
        medicalMotif={mission.medical_motif}
        transportType={mission.transport_type}
        returnTrip={mission.return_trip}
      />

      <CoursePassengerBlock
        type={mission.type}
        patientName={mission.patient_name}
        passengers={mission.passengers}
        companion={mission.companion}
        phone={mission.phone}
        notes={mission.notes}
      />

      <CoursePriceBlock
        mission={mission}
        fallbackDistanceKm={c.route ? c.route.distanceM / 1000 : c.traffic ? c.traffic.distanceM / 1000 : null}
        fallbackDurationMin={c.traffic ? c.traffic.durationSec / 60 : c.route ? c.route.durationSec / 60 : null}
      />

      <CourseSharedByBlock
        sharedBy={mission.shared_by}
        currentUserId={c.currentUserId}
        missionId={mission.id}
        visibility={mission.visibility}
      />

      <NavigationButtons gmapsHref={c.gmapsHref} wazeHref={c.wazeHref} />

      <CourseActions phone={mission.phone} smsHref={c.smsHref} onCancel={() => c.setCancelOpen(true)} />

      <CancelMissionDialog
        open={c.cancelOpen}
        submitting={c.cancelling}
        onClose={() => c.setCancelOpen(false)}
        onSubmit={c.cancel}
      />
    </div>
  )
}

function Stat({
  label, value, sub, border = false,
}: { label: string; value: string; sub?: string; border?: boolean }) {
  return (
    <div className={`p-4 ${border ? 'border-l border-warm-200' : ''}`}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-warm-500 mb-1">{label}</p>
      <p className="text-[20px] md:text-[22px] font-bold text-ink tabular-nums tracking-tight leading-none">{value}</p>
      {sub && <p className="text-[10px] text-warm-500 mt-1">{sub}</p>}
    </div>
  )
}

function BackButton({ onBack }: { onBack?: () => void }) {
  const className = 'inline-flex items-center gap-2 text-[13px] font-semibold text-warm-600 hover:text-ink transition-colors'
  if (onBack) {
    return (
      <button type="button" onClick={onBack} className={className}>
        <ArrowLeft className="w-4 h-4" strokeWidth={2} />
        Retour
      </button>
    )
  }
  return (
    <Link href="/dashboard/chauffeur" className={className}>
      <ArrowLeft className="w-4 h-4" strokeWidth={2} />
      Retour
    </Link>
  )
}

function LoadingSkeleton({ onBack }: { onBack?: () => void }) {
  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-2xl md:max-w-3xl mx-auto pb-24 md:pb-6">
      <div className="mb-4"><BackButton onBack={onBack} /></div>
      <div className="h-80 rounded-3xl bg-warm-100 motion-safe:animate-pulse mb-4" />
      <div className="h-24 rounded-2xl bg-warm-100 motion-safe:animate-pulse" />
    </div>
  )
}

function NoCurrentMission({ onBack }: { onBack?: () => void }) {
  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-2xl md:max-w-3xl mx-auto pb-24 md:pb-6">
      <div className="mb-4"><BackButton onBack={onBack} /></div>
      <div className="rounded-2xl border border-warm-200 bg-paper p-10 text-center">
        <p className="text-[20px] font-bold text-ink mb-2 tracking-tight">Aucune course en cours</p>
        <p className="text-sm text-warm-600">Vous n&apos;avez pas de course active pour l&apos;instant.</p>
      </div>
    </div>
  )
}
