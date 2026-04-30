'use client'

import { useAiUsageSection } from './useAiUsageSection'
import { PeriodTable } from './PeriodTable'
import { TopUsersTable } from './TopUsersTable'
import { SectionShell } from './ui/SectionShell'
import { MetricCard } from './ui/MetricCard'
import { SkeletonCard } from './ui/Skeleton'

const SPARK_COLOR = '#1A1A1A'

export function AiUsageSection() {
  const { report, loading, error } = useAiUsageSection()

  return (
    <SectionShell
      title="Coûts API Anthropic"
      subtitle="Claude Haiku 4.5 — 12 derniers mois"
      iconName="psychology"
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
              label="Total appels" value={report.totals.requests.toLocaleString('fr-FR')}
              iconName="api"
              sparkData={[...report.daily].reverse().map((d) => d.requests)}
              sparkColor={SPARK_COLOR}
            />
            <MetricCard
              label="Coût total" value={`$${report.totals.costUsd.toFixed(4)}`}
              iconName="payments"
              sparkData={[...report.daily].reverse().map((d) => d.costUsd)}
              sparkColor={SPARK_COLOR}
            />
            <MetricCard
              label="Tokens entrée" value={report.totals.inputTokens.toLocaleString('fr-FR')}
              iconName="south_east"
            />
            <MetricCard
              label="Tokens sortie" value={report.totals.outputTokens.toLocaleString('fr-FR')}
              iconName="north_east"
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <PeriodTable title="Par jour (30 derniers)" rows={report.daily} />
            <PeriodTable title="Par semaine (12)"        rows={report.weekly} />
            <PeriodTable title="Par mois (12)"           rows={report.monthly} />
          </div>

          <div className="mt-6">
            <TopUsersTable rows={report.topUsers} />
          </div>
        </>
      )}
    </SectionShell>
  )
}
