'use client'

import { useUsersSection } from './useUsersSection'
import { LoginsTable } from './LoginsTable'
import { SectionShell } from './ui/SectionShell'
import { MetricCard } from './ui/MetricCard'
import { SkeletonCard } from './ui/Skeleton'
import { Icon } from '@/components/ui/Icon'

export function UsersSection() {
  const { report, loading, error } = useUsersSection()

  return (
    <SectionShell
      title="Utilisateurs et connexions"
      subtitle="Inscriptions, présence, activité"
      iconName="groups"
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
              label="Total inscrits"
              value={report.counters.totalUsers.toLocaleString('fr-FR')}
              iconName="person_outline"
              accent={`${report.counters.totalDrivers} chauffeurs · ${report.counters.totalClients} clients`}
            />
            <MetricCard
              label="Chauffeurs (30j)"
              value={`+${report.counters.newDrivers30d}`}
              iconName="local_taxi"
              current={report.comparisons.newDrivers.current}
              previous={report.comparisons.newDrivers.previous}
              accent="Nouveaux inscrits"
            />
            <MetricCard
              label="Clients (30j)"
              value={`+${report.counters.newClients30d}`}
              iconName="person_add"
              current={report.comparisons.newClients.current}
              previous={report.comparisons.newClients.previous}
              accent="Nouveaux inscrits"
            />
            <OnlinePulseCard online={report.counters.onlineDrivers} />
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-secondary">Connexions</h3>
              <ConnectionsTrend
                current={report.comparisons.logins.current}
                previous={report.comparisons.logins.previous}
              />
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <LoginsTable title="Par jour (30 derniers)" rows={report.daily} />
              <LoginsTable title="Par semaine (12)"        rows={report.weekly} />
              <LoginsTable title="Par mois (12)"           rows={report.monthly} />
            </div>
          </div>
        </>
      )}
    </SectionShell>
  )
}

function OnlinePulseCard({ online }: { online: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-soft ring-1 ring-line/60">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-bgsoft text-secondary">
              <Icon name="radio_button_checked" size={18} />
            </span>
            <div className="text-xs font-medium uppercase tracking-wide text-muted">En ligne</div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-secondary">
            {online.toLocaleString('fr-FR')}
          </div>
          <div className="mt-0.5 text-xs text-muted">Chauffeurs actifs (&lt; 2 min)</div>
        </div>
        <span className="relative mt-1 flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/60" />
          <span className="relative inline-flex size-2.5 rounded-full bg-emerald-600" />
        </span>
      </div>
    </div>
  )
}

function ConnectionsTrend({ current, previous }: { current: number; previous: number }) {
  const delta = previous > 0 ? ((current - previous) / previous) * 100 : 0
  const iconName = delta > 0.5 ? 'trending_up' : delta < -0.5 ? 'trending_down' : 'trending_flat'
  const color = delta > 0.5 ? 'text-emerald-700' : delta < -0.5 ? 'text-rose-700' : 'text-muted'
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted">30j :</span>
      <span className="font-semibold text-secondary">{current.toLocaleString('fr-FR')}</span>
      <span className={`inline-flex items-center gap-1 ${color}`}>
        <Icon name={iconName} size={14} />
        {Math.abs(delta).toFixed(1)}%
      </span>
    </div>
  )
}
