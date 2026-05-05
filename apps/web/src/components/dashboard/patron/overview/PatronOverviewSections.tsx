'use client'
import { Sparkline } from '@/components/ui/Sparkline'
import { Icon } from '@/components/ui/Icon'
import type { PatronKPIs, PatronActivity } from '@/services/patronOverviewService'
import type { PatronFleetMember, PatronDocAlert } from '@/services/patronFleetService'
const DAY_LABELS = ['J-6', 'J-5', 'J-4', 'J-3', 'J-2', 'Hier', "Auj."]

export function Centered({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-warm-600 dark:text-night-text-soft text-sm py-12 text-center ${className}`}>{children}</div>
}

export function KPIGrid({ kpis }: { kpis: PatronKPIs | null }) {
  if (!kpis) return null
  const evolution = kpis.yesterdayRevenue > 0
    ? Math.round(((kpis.todayRevenue - kpis.yesterdayRevenue) / kpis.yesterdayRevenue) * 100)
    : null
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <KPICard label="Chauffeurs en ligne" value={`${kpis.driversOnline} / ${kpis.driversTotal}`} />
      <KPICard label="Courses en cours" value={kpis.activeMissions} />
      <KPICard label="CA du jour" value={`${kpis.todayRevenue} €`} delta={evolution} deltaSuffix="vs hier" />
      <KPICard label="Alertes documents" value={kpis.alerts} accent={kpis.alerts > 0} />
    </div>
  )
}

function KPICard({ label, value, accent, delta, deltaSuffix }: { label: string; value: string | number; accent?: boolean; delta?: number | null; deltaSuffix?: string }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? 'border-danger/30 bg-danger/5' : 'border-warm-200 dark:border-night-border bg-paper dark:bg-night-surface'}`}>
      <p className="text-xs uppercase tracking-wide text-warm-600 dark:text-night-text-soft">{label}</p>
      <p className={`text-2xl font-extrabold mt-2 ${accent ? 'text-danger' : 'text-ink dark:text-night-text'}`}>{value}</p>
      {delta != null && (
        <p className={`text-[11px] font-bold mt-1 ${delta >= 0 ? 'text-green-600' : 'text-danger'}`}>
          {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}% {deltaSuffix && <span className="text-warm-600 dark:text-night-text-soft font-medium">{deltaSuffix}</span>}
        </p>
      )}
    </div>
  )
}

export function RevenueChart({ kpis }: { kpis: PatronKPIs | null }) {
  if (!kpis) return null
  const total = kpis.revenueLast7Days.reduce((s, v) => s + v, 0)
  return (
    <section className="lg:col-span-2 rounded-2xl border border-warm-200 dark:border-night-border bg-paper dark:bg-night-surface p-4">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="text-sm font-bold text-ink dark:text-night-text">CA des 7 derniers jours</h2>
          <p className="text-xs text-warm-600 dark:text-night-text-soft mt-0.5">Total : <span className="font-bold text-ink dark:text-night-text">{total} €</span></p>
        </div>
      </div>
      <div className="text-brand">
        <Sparkline values={kpis.revenueLast7Days} height={80} />
      </div>
      <div className="grid grid-cols-7 gap-1 mt-1 text-[10px] text-warm-600 dark:text-night-text-soft text-center">
        {DAY_LABELS.map((l, i) => (<span key={i}>{l}</span>))}
      </div>
    </section>
  )
}

export function TopDrivers({ fleet }: { fleet: PatronFleetMember[] }) {
  const top = [...fleet].sort((a, b) => b.todayRevenue - a.todayRevenue).slice(0, 3)
  return (
    <section className="rounded-2xl border border-warm-200 dark:border-night-border bg-paper dark:bg-night-surface p-4">
      <h2 className="text-sm font-bold text-ink dark:text-night-text mb-3">🏆 Top chauffeurs aujourd&apos;hui</h2>
      {top.length === 0 || top[0].todayRevenue === 0 ? (
        <p className="text-xs text-warm-600 dark:text-night-text-soft">Aucune course terminée aujourd&apos;hui.</p>
      ) : (
        <ol className="space-y-2.5">
          {top.map((d, idx) => (
            <li key={d.id} className="flex items-center gap-2 text-sm">
              <span className="text-base">{['🥇', '🥈', '🥉'][idx]}</span>
              <span className="flex-1 truncate text-ink dark:text-night-text font-medium">{d.name}</span>
              <span className="text-xs text-warm-600 dark:text-night-text-soft">{d.todayMissions} courses</span>
              <span className="text-sm font-bold text-ink dark:text-night-text tabular-nums">{d.todayRevenue}€</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export function ActivityList({ activity }: { activity: PatronActivity[] }) {
  return (
    <section className="rounded-2xl border border-warm-200 dark:border-night-border bg-paper dark:bg-night-surface p-4">
      <h2 className="text-sm font-bold text-ink dark:text-night-text mb-3">Activité récente</h2>
      {activity.length === 0 ? (
        <div className="py-6 text-center">
          <Icon name="history" size={28} />
          <p className="text-xs text-warm-600 dark:text-night-text-soft mt-2">Aucune course récente</p>
        </div>
      ) : (
        <ul className="divide-y divide-warm-100 dark:divide-night-border max-h-[320px] overflow-y-auto -mx-2">
          {activity.map((a) => (
            <ActivityRow key={a.id} item={a} />
          ))}
        </ul>
      )}
    </section>
  )
}

function ActivityRow({ item }: { item: PatronActivity }) {
  const done = item.type === 'complete'
  const dotClass = done ? 'bg-green-500/15 text-green-700 dark:text-green-400' : 'bg-brand/15 text-ink dark:text-night-brand'
  const icon = done ? 'check_circle' : 'pending'
  return (
    <li className="flex items-center gap-3 px-2 py-2.5">
      <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${dotClass}`}>
        <Icon name={icon} size={18} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink dark:text-night-text truncate">
          <span className="font-medium">{item.from}</span>
          <span className="text-warm-500 mx-1">→</span>
          <span className="font-medium">{item.to}</span>
        </p>
        <p className="text-[11px] text-warm-600 dark:text-night-text-soft mt-0.5">
          {done ? 'Terminée' : 'Acceptée'} · {item.time}
        </p>
      </div>
      {item.price != null && (
        <span className="shrink-0 text-sm font-bold text-ink dark:text-night-text tabular-nums">{item.price}€</span>
      )}
    </li>
  )
}

export function DocAlertsList({ alerts }: { alerts: PatronDocAlert[] }) {
  if (alerts.length === 0) return null
  return (
    <section className="rounded-2xl border border-danger/30 bg-danger/5 p-4">
      <h2 className="text-sm font-bold text-danger mb-3">Documents qui expirent ({alerts.length})</h2>
      <ul className="space-y-1 text-sm">
        {alerts.map((a) => (
          <li key={a.id} className="flex justify-between">
            <span className="text-ink dark:text-night-text">{a.driver} · {a.doc}</span>
            <span className={`text-xs font-bold ${a.daysLeft <= 7 ? 'text-danger' : 'text-warm-600 dark:text-night-text-soft'}`}>
              {a.daysLeft <= 0 ? 'Expiré' : `dans ${a.daysLeft}j`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
