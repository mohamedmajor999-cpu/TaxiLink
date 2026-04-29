'use client'

import { useMissionsSection } from './useMissionsSection'
import { MissionsTable } from './MissionsTable'

export function MissionsSection() {
  const { report, loading, error } = useMissionsSection()

  if (loading) return <Shell><Loading /></Shell>
  if (error)   return <Shell><ErrorBox message={error} /></Shell>
  if (!report) return null

  const t = report.totals
  return (
    <Shell>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Stat label="Postées"       value={t.posted.toLocaleString('fr-FR')} />
        <Stat label="Acceptées"     value={t.accepted.toLocaleString('fr-FR')} />
        <Stat label="Terminées"     value={t.completed.toLocaleString('fr-FR')} />
        <Stat label="Taux accept."  value={`${t.acceptanceRate}%`} />
        <Stat label="Montant moyen" value={`${t.averageAmount.toFixed(0)}€`} />
        <Stat label="CA total"      value={`${t.totalAmount.toFixed(0)}€`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <MissionsTable title="Par jour (30 derniers)" rows={report.daily} />
        <MissionsTable title="Par semaine (12)"       rows={report.weekly} />
        <MissionsTable title="Par mois (12)"          rows={report.monthly} />
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-soft md:p-6">
      <h2 className="mb-4 text-xl font-semibold text-secondary">Activité courses (12 derniers mois)</h2>
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

function Loading()                              { return <div className="text-sm text-muted">Chargement…</div> }
function ErrorBox({ message }: { message: string }) {
  return <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{message}</div>
}
