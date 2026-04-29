'use client'

import { useUsersSection } from './useUsersSection'
import { LoginsTable } from './LoginsTable'

export function UsersSection() {
  const { report, loading, error } = useUsersSection()

  if (loading) return <Shell><Loading /></Shell>
  if (error)   return <Shell><ErrorBox message={error} /></Shell>
  if (!report) return null

  const c = report.counters
  return (
    <Shell>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total inscrits"       value={c.totalUsers.toLocaleString('fr-FR')} />
        <Stat label="Chauffeurs"           value={c.totalDrivers.toLocaleString('fr-FR')} accent={`+${c.newDrivers30d} (30j)`} />
        <Stat label="Clients"              value={c.totalClients.toLocaleString('fr-FR')} accent={`+${c.newClients30d} (30j)`} />
        <Stat label="🟢 En ligne maintenant" value={c.onlineDrivers.toLocaleString('fr-FR')} accent="Chauffeurs actifs (<2 min)" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <LoginsTable title="Connexions / jour (30 derniers)" rows={report.daily} />
        <LoginsTable title="Connexions / semaine (12)"        rows={report.weekly} />
        <LoginsTable title="Connexions / mois (12)"           rows={report.monthly} />
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-soft md:p-6">
      <h2 className="mb-4 text-xl font-semibold text-secondary">Utilisateurs &amp; connexions</h2>
      {children}
    </section>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl bg-bgsoft p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold text-secondary">{value}</div>
      {accent && <div className="mt-1 text-xs text-muted">{accent}</div>}
    </div>
  )
}

function Loading()                              { return <div className="text-sm text-muted">Chargement…</div> }
function ErrorBox({ message }: { message: string }) {
  return <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{message}</div>
}
