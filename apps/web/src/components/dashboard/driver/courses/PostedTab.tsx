'use client'
import { Clock, CheckCircle2, Loader2 } from 'lucide-react'
import { RouteTimeline } from '@/components/taxilink/RouteTimeline'
import { RideBadge } from '@/components/taxilink/RideBadge'
import { useMissionEditStore } from '@/store/missionEditStore'
import { usePostedTab, type PostedMissionView } from './usePostedTab'

export function PostedTab() {
  const p = usePostedTab()
  const startEdit = useMissionEditStore((s) => s.startEdit)

  if (p.loading) {
    return (
      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        {[0, 1].map((i) => (
          <li key={i} className="h-40 rounded-2xl bg-warm-100 motion-safe:animate-pulse" />
        ))}
      </ul>
    )
  }
  if (p.error) {
    return (
      <div className="mt-6 rounded-2xl border border-danger/30 bg-danger-soft p-5 text-sm text-danger">
        {p.error}
      </div>
    )
  }

  if (p.items.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-warm-200 bg-paper p-10 text-center">
        <p className="text-[20px] font-bold leading-tight text-ink mb-2 tracking-tight">
          Aucune course postée
        </p>
        <p className="text-sm text-warm-600">
          Quand vous partagerez une course avec le réseau, elle apparaîtra ici.
        </p>
      </div>
    )
  }

  return (
    <ul className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
      {p.items.map((item) => (
        <li key={item.mission.id}>
          <PostedCard
            item={item}
            deleting={p.deletingId === item.mission.id}
            onEdit={() => startEdit(item.mission)}
            onDelete={() => p.remove(item.mission.id)}
          />
        </li>
      ))}
    </ul>
  )
}

function PostedCard({
  item, deleting, onEdit, onDelete,
}: {
  item: PostedMissionView
  deleting: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const { mission, status } = item
  const isWaiting = status === 'waiting'
  const cardStyle = isWaiting
    ? 'bg-paper border-2 border-dashed border-warm-300 rounded-2xl overflow-hidden'
    : 'bg-paper border border-warm-200 rounded-2xl overflow-hidden shadow-soft'

  return (
    <article className={cardStyle}>
      <div className="px-5 pt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isWaiting ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand text-ink text-[11px] font-semibold">
              <Clock className="w-3 h-3" strokeWidth={2} />
              En attente
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ink text-paper text-[11px] font-semibold">
              <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
              Acceptée
            </span>
          )}
          <RideBadge variant={mission.type === 'CPAM' ? 'medical' : mission.type === 'PRIVE' ? 'private' : 'fleet'}>
            {mission.type === 'CPAM' ? 'Médical' : mission.type === 'PRIVE' ? 'Privé' : 'TaxiLink'}
          </RideBadge>
        </div>
        <span className="text-[11px] text-warm-500">
          {new Date(mission.scheduled_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="px-5 pt-4 grid grid-cols-[1fr_auto] gap-4 items-end">
        <RouteTimeline from={{ name: mission.departure }} to={{ name: mission.destination }} />
        <div className="text-right">
          <div className="text-[32px] font-bold leading-none text-ink tabular-nums tracking-tight">
            {Number(mission.price_eur ?? 0)}<span className="text-[24px]">€</span>
          </div>
        </div>
      </div>

      <div className="px-5 pt-3 pb-4 flex items-center justify-between gap-2">
        <span className="text-[11px] text-warm-500">Postée par vous</span>
        {isWaiting ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onEdit}
              disabled={deleting}
              className="h-8 px-3 rounded-lg text-[12px] font-semibold text-warm-600 hover:bg-warm-50 transition-colors disabled:opacity-50"
            >
              Modifier
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="h-8 px-3 rounded-lg text-[12px] font-semibold text-danger hover:bg-danger-soft transition-colors inline-flex items-center gap-1 disabled:opacity-50"
            >
              {deleting && <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2} />}
              Supprimer
            </button>
          </div>
        ) : (
          <span className="text-[11px] font-semibold text-ink">Chauffeur confirmé</span>
        )}
      </div>
    </article>
  )
}
