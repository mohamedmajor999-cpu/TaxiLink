'use client'
import { usePatronFinances } from './usePatronFinances'
import { Sparkline } from '@/components/ui/Sparkline'

export function PatronFinances() {
  const { kpis, recentCpam, isLoading, error } = usePatronFinances()

  if (isLoading) return <p className="py-12 text-center text-warm-600 dark:text-night-text-soft text-sm">Chargement…</p>
  if (error) return <p className="py-12 text-center text-danger text-sm">Erreur : {error}</p>
  if (!kpis) return null

  const total30 = kpis.revenueLast30Days.reduce((s, v) => s + v, 0)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-extrabold text-ink dark:text-night-text">Finances</h1>
        <p className="text-sm text-warm-600 dark:text-night-text-soft mt-1">Suivi du chiffre d&apos;affaires de votre flotte</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <FinKPI label="CA total" value={`${kpis.totalRevenue} €`} />
        <FinKPI label="CA ce mois" value={`${kpis.monthRevenue} €`} />
        <FinKPI label="CA cette semaine" value={`${kpis.weekRevenue} €`} />
        <FinKPI label="CA 30 derniers jours" value={`${total30} €`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 rounded-2xl border border-warm-200 dark:border-night-border bg-paper dark:bg-night-surface p-4">
          <h2 className="text-sm font-bold text-ink dark:text-night-text mb-3">CA des 30 derniers jours</h2>
          <div className="text-brand">
            <Sparkline values={kpis.revenueLast30Days} height={100} />
          </div>
        </section>

        <section className="rounded-2xl border border-warm-200 dark:border-night-border bg-paper dark:bg-night-surface p-4">
          <h2 className="text-sm font-bold text-ink dark:text-night-text mb-3">Répartition mois en cours</h2>
          <RepartitionBar cpam={kpis.cpamRevenue} priv={kpis.privateRevenue} />
        </section>
      </div>

      <section className="rounded-2xl border border-warm-200 dark:border-night-border bg-paper dark:bg-night-surface p-4">
        <h2 className="text-sm font-bold text-ink dark:text-night-text mb-3">Dernières courses CPAM ({recentCpam.length})</h2>
        {recentCpam.length === 0 ? (
          <p className="text-xs text-warm-600 dark:text-night-text-soft">Aucune course CPAM récente.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-warm-600 dark:text-night-text-soft border-b border-warm-200 dark:border-night-border">
                  <th className="py-2 font-bold">Date</th>
                  <th className="py-2 font-bold">Chauffeur</th>
                  <th className="py-2 font-bold">Patient</th>
                  <th className="py-2 font-bold text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {recentCpam.map((m) => (
                  <tr key={m.id} className="border-b border-warm-100 dark:border-night-border last:border-b-0">
                    <td className="py-2 text-warm-600 dark:text-night-text-soft">{formatDate(m.scheduled_at)}</td>
                    <td className="py-2 text-ink dark:text-night-text">{m.driver_name}</td>
                    <td className="py-2 text-warm-600 dark:text-night-text-soft">{m.patient_name ?? '—'}</td>
                    <td className="py-2 text-right font-bold text-ink dark:text-night-text tabular-nums">{m.price_eur} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function FinKPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-warm-200 dark:border-night-border bg-paper dark:bg-night-surface p-4">
      <p className="text-xs uppercase tracking-wide text-warm-600 dark:text-night-text-soft">{label}</p>
      <p className="text-2xl font-extrabold mt-2 text-ink dark:text-night-text">{value}</p>
    </div>
  )
}

function RepartitionBar({ cpam, priv }: { cpam: number; priv: number }) {
  const total = cpam + priv
  const cpamPct = total > 0 ? (cpam / total) * 100 : 0
  return (
    <div className="space-y-3">
      <div className="text-2xl font-extrabold text-ink dark:text-night-text">{total} €</div>
      <div className="h-2 rounded-full bg-warm-100 dark:bg-night-elevated overflow-hidden flex">
        <div className="h-full bg-brand" style={{ width: `${cpamPct}%` }} />
        <div className="h-full bg-warm-400" style={{ width: `${100 - cpamPct}%` }} />
      </div>
      <div className="flex justify-between text-xs">
        <span className="flex items-center gap-1.5 text-warm-700 dark:text-night-text-soft">
          <span className="w-2 h-2 rounded-full bg-brand" /> CPAM <span className="font-bold text-ink dark:text-night-text">{cpam} €</span>
        </span>
        <span className="flex items-center gap-1.5 text-warm-700 dark:text-night-text-soft">
          <span className="w-2 h-2 rounded-full bg-warm-400" /> Privé <span className="font-bold text-ink dark:text-night-text">{priv} €</span>
        </span>
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' }).format(new Date(iso))
}
