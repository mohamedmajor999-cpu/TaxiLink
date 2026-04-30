'use client'

import { useAiUsageSection } from './useAiUsageSection'
import { PeriodTable } from './PeriodTable'
import { TopUsersTable } from './TopUsersTable'
import { SectionShell } from './ui/SectionShell'
import { MetricCard } from './ui/MetricCard'
import { SkeletonCard } from './ui/Skeleton'

export function AiUsageSection() {
  const { report, loading, error } = useAiUsageSection()

  return (
    <SectionShell
      title="Coûts API Anthropic"
      subtitle="Claude Haiku 4.5 — 12 derniers mois"
      icon={<span className="text-lg">🤖</span>}
      iconBg="bg-purple-100 text-purple-700"
    >
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}
      {error && <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {report && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Total appels"  value={report.totals.requests.toLocaleString('fr-FR')}
              icon={<span>📞</span>} iconBg="bg-purple-100 text-purple-700"
              sparkData={[...report.daily].reverse().map((d) => d.requests)}
              sparkColor="#8B5CF6"
            />
            <MetricCard
              label="Coût total"    value={`$${report.totals.costUsd.toFixed(4)}`}
              icon={<span>💸</span>} iconBg="bg-rose-100 text-rose-700"
              sparkData={[...report.daily].reverse().map((d) => d.costUsd)}
              sparkColor="#F43F5E"
            />
            <MetricCard
              label="Tokens entrée"  value={report.totals.inputTokens.toLocaleString('fr-FR')}
              icon={<span>↘️</span>} iconBg="bg-indigo-100 text-indigo-700"
            />
            <MetricCard
              label="Tokens sortie"  value={report.totals.outputTokens.toLocaleString('fr-FR')}
              icon={<span>↗️</span>} iconBg="bg-emerald-100 text-emerald-700"
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
