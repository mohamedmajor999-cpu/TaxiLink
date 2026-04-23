'use client'
import { Clock, CheckCircle2, Loader2 } from 'lucide-react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { RideBadge } from '@/components/taxilink/RideBadge'
import { ToastContainer } from '@/components/ui/Toast'
import { useMissionEditStore } from '@/store/missionEditStore'
import { usePostedTab, type PostedMissionView } from './usePostedTab'
import { AcceptedBanner } from './AcceptedBanner'
import { computeDisplayFare } from '@/lib/missionFare'
import type { Mission } from '@/lib/supabase/types'

export function PostedTab() {
  const p = usePostedTab()
  const startEdit = useMissionEditStore((s) => s.startEdit)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const openEdit = (mission: Mission) => {
    startEdit(mission)
    const params = new URLSearchParams(searchParams.toString())
    params.set('editer', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  if (p.loading) {
    return (
      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-6">
        {[0, 1].map((i) => (
          <li key={i} className="h-24 rounded-xl bg-warm-100 motion-safe:animate-pulse" />
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
      <>
        <ToastContainer toasts={p.toasts} onDismiss={p.dismissToast} />
        <div className="mt-6 rounded-2xl border border-warm-200 bg-paper p-10 text-center">
          <p className="text-[20px] font-bold leading-tight text-ink mb-2 tracking-tight">
            Aucune course postée
          </p>
          <p className="text-sm text-warm-600">
            Quand vous partagerez une course avec le réseau, elle apparaîtra ici.
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      <ToastContainer toasts={p.toasts} onDismiss={p.dismissToast} />
      <ul className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-3 items-stretch">
        {p.items.map((item) => (
          <li key={item.mission.id} className="h-full">
            <PostedCard
              item={item}
              deleting={p.deletingId === item.mission.id}
              onEdit={() => openEdit(item.mission)}
              onDelete={() => p.remove(item.mission.id)}
            />
          </li>
        ))}
      </ul>
    </>
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
  const { mission, status, driverProfile } = item
  const isWaiting = status === 'waiting'
  const fare = computeDisplayFare(mission)

  const cardStyle = isWaiting
    ? 'h-full flex flex-col bg-paper border-2 border-dashed border-warm-300 rounded-xl overflow-hidden'
    : 'h-full flex flex-col bg-paper border border-warm-200 rounded-xl overflow-hidden shadow-soft'

  const dateLabel = new Date(mission.scheduled_at).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })

  return (
    <article className={cardStyle}>
      <div className="px-4 pt-3 flex items-center justify-between gap-3">
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
        <span className="text-[11px] text-warm-500">{dateLabel}</span>
      </div>

      <div className="px-4 pt-2 pb-3 flex items-end justify-between gap-3 flex-1">
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-[12px] text-warm-500 truncate">{mission.departure}</p>
          <p className="text-[11px] text-warm-400 leading-none">&#8595;</p>
          <p className="text-[12px] font-semibold text-ink truncate">{mission.destination}</p>
        </div>
        <div className="shrink-0 text-right">
          {fare.isEstimated && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-warm-500 mb-0.5">
              Estimé
            </p>
          )}
          <p className="text-[18px] font-bold leading-none text-ink tabular-nums tracking-tight">
            {fare.value}<span className="text-[14px]">€</span>
          </p>
        </div>
      </div>

      {!isWaiting && (
        <AcceptedBanner profile={driverProfile} acceptedAt={mission.accepted_at} />
      )}

      <div className="px-4 pb-3 flex items-center justify-between gap-2">
        <span className="text-[11px] text-warm-500">Postée par vous</span>
        {isWaiting && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onEdit}
              disabled={deleting}
              className="h-7 px-3 rounded-lg text-[11px] font-semibold text-warm-600 hover:bg-warm-50 transition-colors disabled:opacity-50"
            >
              Modifier
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="h-7 px-3 rounded-lg text-[11px] font-semibold text-danger hover:bg-danger-soft transition-colors inline-flex items-center gap-1 disabled:opacity-50"
            >
              {deleting && <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2} />}
              Supprimer
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
