'use client'

import { ArrowLeft, Plus, ChevronRight, TrendingUp } from 'lucide-react'
import type { GroupMemberStats } from '@taxilink/core'
import type { GroupDailyActivity } from '@/services/groupStatsService'
import { useGroupDetail } from './useGroupDetail'

interface Props {
  groupId: string
}

export function GroupDetailScreen({ groupId }: Props) {
  const c = useGroupDetail(groupId)

  if (c.loading) return <Shell onBack={c.back}><div className="h-64 rounded-3xl bg-warm-100 motion-safe:animate-pulse" /></Shell>
  if (!c.group) return (
    <Shell onBack={c.back}>
      <div className="rounded-2xl border border-warm-200 bg-paper p-10 text-center">
        <p className="text-[20px] font-bold text-ink mb-2">Groupe introuvable</p>
        {c.error && <p className="text-[13px] text-warm-500">{c.error}</p>}
      </div>
    </Shell>
  )

  const g = c.group
  const membersCount = g.memberCount ?? 0

  return (
    <Shell onBack={c.back}>
      <section className="rounded-3xl border border-warm-200 bg-paper px-6 pt-8 pb-6 mb-3 text-center">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-ink flex items-center justify-center mb-3">
          <span className="text-brand text-[36px] font-bold leading-none">
            {g.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <h1 className="text-[22px] font-bold text-ink tracking-tight">{g.name}</h1>
        {g.description && (
          <p className="text-[13px] text-warm-500 mt-1 max-w-md mx-auto">{g.description}</p>
        )}

        <div className="mt-5 grid grid-cols-3 divide-x divide-warm-200">
          <Stat value={`${membersCount}`}                        label="Membres" />
          <Stat value={`${c.summary?.onlineCount ?? 0}`}         label="En ligne" dot />
          <Stat value={`${c.summary?.available ?? 0}`}           label="Courses dispo" />
        </div>
      </section>

      <div className="mb-3">
        <button
          type="button"
          onClick={c.postCourse}
          className="w-full h-14 rounded-2xl bg-ink text-paper text-[15px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <Plus className="w-5 h-5 text-brand" strokeWidth={2.5} />
          Poster une course
        </button>
      </div>

      {c.myStats && <MyStatsPanel stats={c.myStats} />}

      <ActivityPanel total={c.summary?.exchanged7d ?? 0} daily={c.daily} />

      <section className="mt-4">
        <header className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-[15px] font-bold text-ink">Membres</h2>
          {membersCount > c.members.length && (
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-warm-600">
              Voir tous ({membersCount})
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
            </span>
          )}
        </header>
        <div className="flex flex-col gap-2">
          {c.members.slice(0, 4).map((m) => <MemberRow key={m.driverId} member={m} />)}
          {c.members.length === 0 && (
            <p className="text-[13px] text-warm-500 text-center py-6">Aucun membre chargé</p>
          )}
        </div>
      </section>

      <button
        type="button"
        onClick={c.leave}
        disabled={c.leaving}
        className="mt-5 w-full h-12 rounded-2xl border border-warm-200 bg-paper text-[14px] font-bold text-danger hover:bg-danger-soft disabled:opacity-50 transition-colors"
      >
        {c.leaving ? 'Sortie…' : 'Quitter le groupe'}
      </button>
    </Shell>
  )
}

function Shell({ children, onBack }: { children: React.ReactNode; onBack: () => void }) {
  return (
    <div className="px-4 md:px-8 py-3 md:py-6 max-w-2xl md:max-w-3xl mx-auto pb-24 md:pb-6">
      <header className="mb-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-warm-600 hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          Retour
        </button>
      </header>
      {children}
    </div>
  )
}

function Stat({ value, label, dot = false }: { value: string; label: string; dot?: boolean }) {
  return (
    <div className="px-2 py-1 text-center">
      <p className="text-[22px] font-bold text-ink leading-none tabular-nums">
        {dot && <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand align-middle mr-1.5" />}
        {value}
      </p>
      <p className="text-[11px] text-warm-500 mt-1.5">{label}</p>
    </div>
  )
}

function MyStatsPanel({ stats }: {
  stats: { shared: number; accepted: number; percentile: number; totalMembers: number }
}) {
  // Le percentile peut être interprété différemment selon le rang. On formule
  // toujours en positif pour ne pas humilier (cf. décision UX : pas de classement
  // public). Si percentile <= 30 → top X% ; sinon on cache la mention de rang.
  const isTop = stats.percentile <= 30
  return (
    <section className="mb-3 rounded-2xl border border-warm-200 bg-paper p-4" aria-label="Mes stats privées dans ce groupe">
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-xl bg-brand/15 text-ink grid place-items-center shrink-0">
          <TrendingUp className="w-4 h-4" strokeWidth={2} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-warm-500 mb-1">
            Mes stats · privé
          </p>
          <p className="text-[13.5px] text-ink leading-snug">
            Tu as <strong>partagé {stats.shared}</strong> course{stats.shared > 1 ? 's' : ''}
            {' '}et <strong>accepté {stats.accepted}</strong> course{stats.accepted > 1 ? 's' : ''}
            {' '}dans ce groupe.
          </p>
          {isTop && (stats.shared + stats.accepted) > 0 && (
            <p className="text-[12px] text-emerald-700 mt-1 font-semibold">
              Top {stats.percentile}% du groupe sur l&apos;activité.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function ActivityPanel({ total, daily }: { total: number; daily: GroupDailyActivity[] }) {
  const max = Math.max(1, ...daily.map((d) => d.count))
  const today = new Date().toISOString().slice(0, 10)
  return (
    <section className="rounded-2xl bg-warm-50 border border-warm-100 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-warm-500">
        Activité · 7 derniers jours
      </p>
      <div className="mt-2 flex items-end gap-3">
        <div className="shrink-0">
          <p className="text-[28px] font-bold text-ink leading-none tabular-nums">{total}</p>
          <p className="text-[11px] text-warm-500 mt-1">Courses échangées</p>
        </div>
        <div className="flex-1 flex items-end justify-end gap-1.5 h-14">
          {daily.map((d) => {
            const h = Math.round((d.count / max) * 100)
            const isToday = d.date === today
            return (
              <div
                key={d.date}
                className={`w-5 rounded-t-md ${isToday ? 'bg-brand' : 'bg-warm-300'}`}
                style={{ height: `${Math.max(8, h)}%` }}
                aria-label={`${d.count} courses le ${d.date}`}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}

function MemberRow({ member }: { member: GroupMemberStats }) {
  const name =
    member.lastName && member.firstName
      ? `${member.lastName} ${member.firstName.charAt(0).toUpperCase()}.`
      : member.fullName || member.lastName || member.firstName || 'Chauffeur'
  const info =
    member.role === 'admin'
      ? `${member.sharedCount + member.acceptedCount} activités`
      : member.isOnline
        ? 'En ligne'
        : 'Hors ligne'
  const initial = (name.charAt(0) || '?').toUpperCase()

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-paper border border-warm-200">
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-full bg-ink flex items-center justify-center">
          <span className="text-brand text-[14px] font-bold">{initial}</span>
        </div>
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-paper ${
            member.isOnline ? 'bg-emerald-500' : 'bg-warm-300'
          }`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold text-ink truncate">{name}</p>
        <p className="text-[12px] text-warm-500 mt-0.5 truncate">{info}</p>
      </div>
      {member.role === 'admin' && (
        <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-brand text-ink text-[10px] font-bold uppercase tracking-wider">
          Admin
        </span>
      )}
    </div>
  )
}
