'use client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ToastContainer } from '@/components/ui/Toast'
import { useMissionEditStore } from '@/store/missionEditStore'
import { usePostedTab } from './usePostedTab'
import { PostedRow } from './PostedRow'
import { PostedMissionModal } from './PostedMissionModal'
import type { Mission } from '@/lib/supabase/types'

interface Props {
  onPostCourse: () => void
}

export function PostedTab({ onPostCourse }: Props) {
  const p = usePostedTab()
  const startEdit = useMissionEditStore((s) => s.startEdit)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const openEdit = (mission: Mission) => {
    startEdit(mission)
    p.closeDetail()
    const params = new URLSearchParams(searchParams.toString())
    params.set('editer', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  if (p.loading) {
    return (
      <ul className="mt-6 space-y-2">
        {[0, 1, 2].map((i) => (
          <li key={i} className="h-[64px] rounded-2xl bg-warm-100 motion-safe:animate-pulse" />
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
        <PostedEmpty onPostCourse={onPostCourse} />
      </>
    )
  }

  return (
    <>
      <ToastContainer toasts={p.toasts} onDismiss={p.dismissToast} />
      <div className="mt-6 space-y-4">
        {p.groups.map((g) => (
          <section key={g.key}>
            <h3 className="text-[10.5px] font-extrabold uppercase tracking-wider text-warm-500 px-1 mb-2">
              {g.label}
            </h3>
            <ul className="space-y-2">
              {g.items.map((item) => (
                <li key={item.mission.id}>
                  <PostedRow
                    mission={item.mission}
                    takerName={item.driverProfile?.full_name ?? null}
                    onClick={() => p.openDetail(item.mission.id)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {p.selectedItem && (
        <PostedMissionModal
          mission={p.selectedItem.mission}
          driverProfile={p.selectedItem.driverProfile}
          deleting={p.deletingId === p.selectedItem.mission.id}
          boosting={p.boostingId === p.selectedItem.mission.id}
          onClose={p.closeDetail}
          onEdit={() => openEdit(p.selectedItem!.mission)}
          onBoost={() => p.boostPrice(p.selectedItem!.mission.id)}
          onDelete={() => p.remove(p.selectedItem!.mission.id)}
        />
      )}
    </>
  )
}

function PostedEmpty({ onPostCourse }: { onPostCourse: () => void }) {
  return (
    <div className="mt-6 rounded-3xl border border-dashed border-warm-300 bg-warm-50 p-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-brand-soft text-ink inline-flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="10" r="3" />
          <path d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z" />
        </svg>
      </div>
      <p className="text-[18px] font-extrabold text-ink mb-1.5 tracking-tight">
        Aucune course postée
      </p>
      <p className="text-sm text-warm-500 mb-5 max-w-[260px] mx-auto leading-relaxed">
        Un trajet en surplus ? Partagez-le avec le réseau et touchez une commission.
      </p>
      <button
        type="button"
        onClick={onPostCourse}
        className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-ink text-paper text-sm font-bold hover:bg-warm-800 transition-colors active:scale-[0.98]"
      >
        Poster une course
      </button>
    </div>
  )
}
