'use client'
import dynamic from 'next/dynamic'
import { Lock } from 'lucide-react'
import { RouteTimeline } from '@/components/taxilink/RouteTimeline'
import { ToastContainer } from '@/components/ui/Toast'
import { addressAsPoint } from '@/lib/splitFrenchAddress'
import { computeDisplayFare } from '@/lib/missionFare'
import { useDriverStore } from '@/store/driverStore'
import { useMissionDetail } from './course/useMissionDetail'
import { ReasonDialog, CANCEL_REASONS, NO_SHOW_REASONS } from './course/ReasonDialog'
import { CourseTopStats } from './course/CourseTopStats'
import { CourseDetailsTable } from './course/CourseDetailsTable'
import { CourseActions } from './course/CourseActions'
import { CourseCorrections } from './course/CourseCorrections'
import { ManualCourseActions } from './course/ManualCourseActions'
import { MissionDetailShell, MissionDetailStat } from './course/MissionDetailShell'
import { AgendaAddModal } from './courses/AgendaAddModal'
import { MAX_OFFSET } from './courses/useAgendaTab'
import { startOfDay, addDays } from './courses/agendaHelpers'

const CourseMap = dynamic(() => import('./course/CourseMap').then((m) => m.CourseMap), { ssr: false })

const TERMINAL_STATUSES = new Set(['DONE', 'CANCELLED'])

interface Props {
  missionId: string
  onBack?: () => void
}

export function MissionDetailScreen({ missionId, onBack }: Props) {
  const c = useMissionDetail(missionId)
  const driverId = useDriverStore((s) => s.driver.id)

  if (c.loading) return <MissionDetailShell onBack={onBack}><div className="h-64 rounded-3xl bg-warm-100 motion-safe:animate-pulse mb-3" /></MissionDetailShell>
  if (!c.mission) return (
    <MissionDetailShell onBack={onBack}>
      <div className="rounded-2xl border border-warm-200 bg-paper p-10 text-center">
        <p className="text-[20px] font-bold text-ink mb-2">Course introuvable</p>
      </div>
    </MissionDetailShell>
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
  // Les actions chauffeur (Appeler / Waze / Course terminée / Annuler) ne
  // doivent apparaître qu'au chauffeur qui a *accepté* la course. L'auteur
  // qui a posté l'annonce, ou un viewer tiers, ne doit pas voir ces
  // contrôles — l'annonce reste "lecture seule" tant qu'elle n'est pas prise.
  const canActAsDriver = !!driverId && mission.driver_id === driverId

  return (
    <MissionDetailShell onBack={onBack}>
      <ToastContainer toasts={c.toasts} onDismiss={c.dismissToast} />
      {c.isMasked && (
        <div className="mb-3 flex items-start gap-3 rounded-2xl border border-warm-200 bg-warm-50 p-3">
          <Lock className="w-4 h-4 text-warm-600 shrink-0 mt-0.5" strokeWidth={2} />
          <p className="text-[12.5px] text-warm-700 leading-snug">
            <strong>Coordonnées masquées.</strong> Le nom complet, le téléphone
            et les notes seront visibles uniquement après acceptation de la
            course{mission.type === 'CPAM' ? ' (RGPD Art. 9, données de santé)' : ''}.
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
          <MissionDetailStat label="Distance" value={km ? `${km} km` : '—'} />
          <MissionDetailStat
            label="Trafic"
            value={trafficMin ? `${trafficMin} min` : routeMin ? `${routeMin} min` : '—'}
            sub={trafficSub}
            border
          />
          <MissionDetailStat
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

      <CourseCorrections
        mission={mission}
        driverId={driverId || null}
        saving={c.correcting}
        onCorrect={c.correct}
      />

      <CourseDetailsTable mission={mission} masked={c.isMasked} />

      {!isTerminal && canActAsDriver && (
        <CourseActions
          phone={mission.phone}
          smsHref={c.smsHref}
          wazeHref={c.wazeHref}
          gmapsHref={c.gmapsHref}
          step={c.step}
          onAdvance={c.advanceStep}
          onComplete={c.complete}
          onCancel={() => c.setCancelOpen(true)}
          onNoShow={() => c.setNoShowOpen(true)}
          advancing={c.advancing}
          completing={c.completing}
        />
      )}

      {c.isManual && (
        <ManualCourseActions
          onEdit={() => c.setEditOpen(true)}
          onConfirmDelete={c.remove}
          removing={c.removing}
        />
      )}

      <ReasonDialog
        open={c.cancelOpen}
        submitting={c.cancelling}
        title="Annuler la course"
        reasons={CANCEL_REASONS}
        submitLabel="Confirmer"
        submittingLabel="Annulation…"
        variant="danger"
        onClose={() => c.setCancelOpen(false)}
        onSubmit={c.cancel}
      />

      <ReasonDialog
        open={c.noShowOpen}
        submitting={c.noShowSubmitting}
        title="Client absent"
        subtitle="La course sera clôturée mais ne comptera pas dans votre CA."
        reasons={NO_SHOW_REASONS}
        submitLabel="Confirmer l'absence"
        submittingLabel="Envoi…"
        variant="ink"
        onClose={() => c.setNoShowOpen(false)}
        onSubmit={c.noShow}
      />

      {c.isManual && c.editOpen && (
        <AgendaAddModal
          selectedDate={new Date(mission.scheduled_at)}
          mission={mission}
          minDate={startOfDay(new Date())}
          maxDate={addDays(startOfDay(new Date()), MAX_OFFSET)}
          onClose={() => c.setEditOpen(false)}
          onAdded={c.applyEdit}
        />
      )}
    </MissionDetailShell>
  )
}
