'use client'

import { useGpsTrackingSection } from './useGpsTrackingSection'
import { SectionShell } from './ui/SectionShell'
import { MetricCard } from './ui/MetricCard'
import { SkeletonCard } from './ui/Skeleton'
import type { GpsTrackingFlags, GpsTrackingMission } from '@/services/adminGpsTrackingTypes'

const STEPS: { key: keyof GpsTrackingFlags; label: string }[] = [
  { key: 'enroute',       label: 'En route' },
  { key: 'arrivedPickup', label: 'Arr. pickup' },
  { key: 'pickup',        label: 'À bord' },
  { key: 'arrivedDest',   label: 'Arr. dest.' },
  { key: 'dropoff',       label: 'Déposé' },
  { key: 'completed',     label: 'Terminé' },
]

export function GpsTrackingSection() {
  const { report, loading, error } = useGpsTrackingSection()

  return (
    <SectionShell
      title="Suivi GPS automatique"
      subtitle="30 derniers jours — % de courses suivies par GPS sans intervention manuelle"
      iconName="my_location"
    >
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}
      {error && <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      {report && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Courses 30j" value={report.counters.total.toLocaleString('fr-FR')}
              iconName="route"
            />
            <MetricCard
              label="Suivi complet" value={`${report.counters.fullAutoPct}%`}
              accent={`${report.counters.fullAuto} / ${report.counters.total}`}
              iconName="check_circle"
            />
            <MetricCard
              label="Aucun suivi" value={`${report.counters.noAutoPct}%`}
              accent={`${report.counters.noAuto} / ${report.counters.total}`}
              iconName="location_off"
            />
            <MetricCard
              label="Attente moy. au pickup"
              value={report.counters.avgWaitPickupMin != null ? `${report.counters.avgWaitPickupMin} min` : '—'}
              accent={report.counters.avgWaitDestMin != null ? `${report.counters.avgWaitDestMin} min au dépôt` : undefined}
              iconName="hourglass_top"
            />
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl ring-1 ring-line/60">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-bgsoft text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Heure</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Chauffeur</th>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Étapes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {report.recent.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted">Aucune course assignée sur 30 jours.</td>
                  </tr>
                ) : report.recent.map((m) => <Row key={m.id} mission={m} />)}
              </tbody>
            </table>
          </div>
        </>
      )}
    </SectionShell>
  )
}

function Row({ mission }: { mission: GpsTrackingMission }) {
  const date = new Date(mission.scheduledAt)
  const time = date.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  return (
    <tr className="text-secondary">
      <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums">{time}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
          mission.type === 'CPAM' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
        }`}>
          {mission.type ?? '—'}
        </span>
      </td>
      <td className="px-4 py-3 truncate max-w-[160px]">{mission.driverName}</td>
      <td className="px-4 py-3 truncate max-w-[160px] text-muted">{mission.patientName ?? '—'}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {STEPS.map((s) => {
            const on = mission.flags[s.key]
            return (
              <span key={s.key} title={s.label} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                on ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-bgsoft text-muted ring-1 ring-line/60'
              }`}>
                <span className={`size-1.5 rounded-full ${on ? 'bg-emerald-500' : 'bg-line'}`} />
                {s.label}
              </span>
            )
          })}
        </div>
      </td>
    </tr>
  )
}
