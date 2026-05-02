'use client'
import { useState } from 'react'
import { Eye, Pencil, Trash2 } from 'lucide-react'

interface Props {
  onClose: () => void
  onDetail: () => void
  onEdit: () => void
  onDelete: () => Promise<void> | void
  removing: boolean
}

export function AgendaCardMenu({ onClose, onDetail, onEdit, onDelete, removing }: Props) {
  const [confirm, setConfirm] = useState(false)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-ink/40"
      onClick={() => !removing && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-paper w-full max-w-sm rounded-t-3xl md:rounded-3xl p-3 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        {!confirm && (
          <ul className="divide-y divide-warm-100">
            <Item icon={Eye} label="Voir le détail" onClick={onDetail} />
            <Item icon={Pencil} label="Modifier" onClick={onEdit} />
            <Item
              icon={Trash2}
              label="Supprimer"
              danger
              onClick={() => setConfirm(true)}
            />
          </ul>
        )}

        {confirm && (
          <div className="p-3">
            <h3 className="text-[18px] font-extrabold text-ink mb-1">Supprimer la course ?</h3>
            <p className="text-[13px] text-warm-600 mb-4">
              Cette course sera retirée de votre agenda. Action irréversible.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirm(false)}
                disabled={removing}
                className="flex-1 h-12 rounded-xl bg-warm-50 border border-warm-200 text-warm-700 text-[14px] font-bold disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onDelete()
                  setConfirm(false)
                }}
                disabled={removing}
                className="flex-1 h-12 rounded-xl bg-danger text-paper text-[14px] font-extrabold disabled:opacity-50"
              >
                {removing ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface ItemProps {
  icon: typeof Eye
  label: string
  onClick: () => void
  danger?: boolean
}

function Item({ icon: Icon, label, onClick, danger }: ItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 h-14 text-[15px] font-semibold transition-colors hover:bg-warm-50 rounded-xl ${
          danger ? 'text-danger' : 'text-ink'
        }`}
      >
        <Icon className="w-5 h-5" strokeWidth={2} />
        {label}
      </button>
    </li>
  )
}
