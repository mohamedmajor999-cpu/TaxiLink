'use client'

import { useMissionsSection } from './useMissionsSection'
import { MissionsTable } from './MissionsTable'
import { SectionShell } from './ui/SectionShell'
import { MetricCard } from './ui/MetricCard'
import { SkeletonCard } from './ui/Skeleton'

const SPARK_COLOR = '#1A1A1A'

export function MissionsSection() {
  const { report, loading, error } = useMissionsSection()

  return (
    <SectionShell
      title="Activité courses"
      subtitle="12 derniers mois — postées, acceptées, terminées, CA"
      iconName="assignment"
    >
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {[0, 1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}
      {error && <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      {report && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <MetricCard
              label="Postées" value={report.totals.posted.toLocaleString('fr-FR')}
              iconName="post_add"
              sparkData={[...report.daily].reverse().map((d) => d.posted)}
              sparkColor={SPARK_COLOR}
              current={report.comparisons.current.posted}
              previous={report.comparisons.previous.posted}
            />
            <MetricCard
              label="Acceptées" value={report.totals.accepted.toLocaleString('fr-FR')}
              iconName="check_circle"
              sparkData={[...report.daily].reverse().map((d) => d.accepted)}
              sparkColor={SPARK_COLOR}
              current={report.comparisons.current.accepted}
              previous={report.comparisons.previous.accepted}
            />
            <MetricCard
              label="Terminées" value={report.totals.completed.toLocaleString('fr-FR')}
              iconName="task_alt"
              sparkData={[...report.daily].reverse().map((d) => d.completed)}
              sparkColor={SPARK_COLOR}
              current={report.comparisons.current.completed}
              previous={report.comparisons.previous.completed}
            />
            <MetricCard
              label="Taux accept." value={`${report.totals.acceptanceRate}%`}
              iconName="percent"
              current={report.comparisons.current.acceptanceRate}
              previous={report.comparisons.previous.acceptanceRate}
            />
            <MetricCard
              label="Montant moyen" value={`${report.totals.averageAmount.toFixed(0)}€`}
              iconName="euro_symbol"
            />
            <MetricCard
              label="CA total" value={`${report.totals.totalAmount.toFixed(0)}€`}
              iconName="payments"
              sparkData={[...report.daily].reverse().map((d) => d.totalAmount)}
              sparkColor={SPARK_COLOR}
              current={report.comparisons.current.totalAmount}
              previous={report.comparisons.previous.totalAmount}
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <MissionsTable title="Par jour (30 derniers)" rows={report.daily} />
            <MissionsTable title="Par semaine (12)"       rows={report.weekly} />
            <MissionsTable title="Par mois (12)"          rows={report.monthly} />
          </div>
        </>
      )}
    </SectionShell>
  )
}
