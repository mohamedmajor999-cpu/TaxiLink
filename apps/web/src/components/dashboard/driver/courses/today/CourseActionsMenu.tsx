'use client'
import type { ReactNode } from 'react'
import { MoreHorizontal, MessageSquare, Pencil, UserX, X } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { CancelMissionDialog } from '../../course/CancelMissionDialog'
import { NoShowDialog } from '../../course/NoShowDialog'
import { useCourseActionsMenu } from './useCourseActionsMenu'

interface Props {
  mission: Mission
  onEdit: (mission: Mission) => void
}

export function CourseActionsMenu({ mission, onEdit }: Props) {
  const m = useCourseActionsMenu({ mission })
  const hasPhone = Boolean(mission.phone)

  return (
    <>
      <div className="relative">
        <button
          ref={m.btnRef}
          type="button"
          onClick={m.toggle}
          aria-label="Plus d'actions"
          aria-expanded={m.open}
          aria-haspopup="menu"
          className="w-[38px] h-[38px] rounded-lg border border-warm-200 inline-flex items-center justify-center text-warm-700 hover:bg-warm-50 hover:text-ink transition-colors"
        >
          <MoreHorizontal className="w-3.5 h-3.5" strokeWidth={2} />
        </button>

        {m.open && (
          <div
            ref={m.menuRef}
            role="menu"
            className="absolute bottom-[calc(100%+6px)] right-0 z-10 min-w-[220px] bg-paper border border-warm-200 rounded-xl shadow-[0_12px_32px_-16px_rgba(0,0,0,0.25)] p-1.5"
          >
            {hasPhone && (
              <MenuItem icon={<MessageSquare className="w-3.5 h-3.5" strokeWidth={1.8} />} onClick={m.notifyPatient}>
                Prévenir le patient
              </MenuItem>
            )}
            <MenuItem icon={<Pencil className="w-3.5 h-3.5" strokeWidth={1.8} />} onClick={() => { onEdit(mission); m.close() }}>
              Modifier la course
            </MenuItem>
            <div role="separator" className="h-px bg-warm-100 mx-1.5 my-1" />
            <MenuItem icon={<UserX className="w-3.5 h-3.5" strokeWidth={1.8} />} onClick={m.openNoShow}>
              Patient absent
            </MenuItem>
            <MenuItem icon={<X className="w-3.5 h-3.5" strokeWidth={1.8} />} onClick={m.openCancel} danger>
              Annuler la course
            </MenuItem>
          </div>
        )}
      </div>

      <CancelMissionDialog open={m.cancelOpen} submitting={m.busy} onClose={m.closeCancel} onSubmit={m.submitCancel} />
      <NoShowDialog open={m.noShowOpen} submitting={m.busy} onClose={m.closeNoShow} onSubmit={m.submitNoShow} />
    </>
  )
}

function MenuItem({ children, icon, onClick, danger }: {
  children: ReactNode
  icon: ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="menuitem"
      className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[13px] font-medium text-left transition-colors ${
        danger ? 'text-danger hover:bg-danger-soft' : 'text-ink hover:bg-warm-50'
      }`}
    >
      <span className={danger ? 'text-danger' : 'text-warm-600'}>{icon}</span>
      {children}
    </button>
  )
}
