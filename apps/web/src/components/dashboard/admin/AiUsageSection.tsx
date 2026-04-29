'use client'

import { useAiUsageSection } from './useAiUsageSection'
import { PeriodTable } from './PeriodTable'
import { TopUsersTable } from './TopUsersTable'

export function AiUsageSection() {
  const { report, loading, error } = useAiUsageSection()

  if (loading) return <SectionShell title="Coûts API Anthropic"><Loading /></SectionShell>
  if (error)   return <SectionShell title="Coûts API Anthropic"><ErrorBox message={error} /></SectionShell>
  if (!report) return null

  return (
    <SectionShell title="Coûts API Anthropic (12 derniers mois)">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total appels"        value={report.totals.requests.toLocaleString('fr-FR')} />
        <Stat label="Coût total"          value={`$${report.totals.costUsd.toFixed(4)}`} />
        <Stat label="Tokens entrée"       value={report.totals.inputTokens.toLocaleString('fr-FR')} />
        <Stat label="Tokens sortie"       value={report.totals.outputTokens.toLocaleString('fr-FR')} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <PeriodTable title="Par jour (30 derniers)"  rows={report.daily} />
        <PeriodTable title="Par semaine (12)"        rows={report.weekly} />
        <PeriodTable title="Par mois (12)"           rows={report.monthly} />
      </div>

      <div className="mt-6">
        <TopUsersTable rows={report.topUsers} />
      </div>
    </SectionShell>
  )
}

function SectionShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-soft md:p-6">
      <h2 className="mb-4 text-xl font-semibold text-secondary">{title}</h2>
      {children}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-bgsoft p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold text-secondary">{value}</div>
    </div>
  )
}

function Loading()   { return <div className="text-sm text-muted">Chargement…</div> }
function ErrorBox({ message }: { message: string }) {
  return <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{message}</div>
}
