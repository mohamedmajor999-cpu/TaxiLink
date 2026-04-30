'use client'

import { useMissionsSection } from './useMissionsSection'
import { MissionsTable } from './MissionsTable'
import { SectionShell } from './ui/SectionShell'
import { MetricCard } from './ui/MetricCard'
import { SkeletonCard } from './ui/Skeleton'

export function MissionsSection() {
  const { report, loading, error } = useMissionsSection()

  return (
    <SectionShell
      title="Activité courses"
      subtitle="12 derniers mois — postées, acceptées, terminées, CA"
      icon={<span className="text-lg">🚕</span>}
      iconBg="bg-amber-100 text-amber-700"
    >
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {[0, 1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}
      {error && <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {report && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <MetricCard
              label="Postées"     value={report.totals.posted.toLocaleString('fr-FR')}
              icon={<span>📝</span>} iconBg="bg-amber-100 text-amber-700"
              sparkData={[...report.daily].reverse().map((d) => d.posted)}
              sparkColor="#F59E0B"
              current={report.comparisons.current.posted}
              previous={report.comparisons.previous.posted}
            />
            <MetricCard
              label="Acceptées"   value={report.totals.accepted.toLocaleString('fr-FR')}
              icon={<span>✅</span>} iconBg="bg-emerald-100 text-emerald-700"
              sparkData={[...report.daily].reverse().map((d) => d.accepted)}
              sparkColor="#10B981"
              current={report.comparisons.current.accepted}
              previous={report.comparisons.previous.accepted}
            />
            <MetricCard
              label="Terminées"   value={report.totals.completed.toLocaleString('fr-FR')}
              icon={<span>🏁</span>} iconBg="bg-indigo-100 text-indigo-700"
              sparkData={[...report.daily].reverse().map((d) => d.completed)}
              sparkColor="#6366F1"
              current={report.comparisons.current.completed}
              previous={report.comparisons.previous.completed}
            />
            <MetricCard
              label="Taux accept." value={`${report.totals.acceptanceRate}%`}
              icon={<span>📈</span>} iconBg="bg-rose-100 text-rose-700"
              current={report.comparisons.current.acceptanceRate}
              previous={report.comparisons.previous.acceptanceRate}
            />
            <MetricCard
              label="Montant moyen" value={`${report.totals.averageAmount.toFixed(0)}€`}
              icon={<span>💶</span>} iconBg="bg-violet-100 text-violet-700"
            />
            <MetricCard
              label="CA total"    value={`${report.totals.totalAmount.toFixed(0)}€`}
              icon={<span>💰</span>} iconBg="bg-emerald-100 text-emerald-700"
              sparkData={[...report.daily].reverse().map((d) => d.totalAmount)}
              sparkColor="#10B981"
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
