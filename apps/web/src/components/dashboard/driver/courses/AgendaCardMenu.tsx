'use client'
import { Eye, Pencil, Trash2, XCircle } from 'lucide-react'

interface Props {
  isManual: boolean
  onClose: () => void
  onDetail: () => void
  onEdit: () => void
  onDelete: () => void
}

/**
 * Menu d'actions sur une carte agenda.
 * Le libellé/icône du dernier bouton change selon le type :
 *  - course manuelle  → "Supprimer" (suppression réelle, géré par le parent)
 *  - course réseau    → "Annuler la course" (libère au pool, motif requis)
 */
export function AgendaCardMenu({ isManual, onClose, onDetail, onEdit, onDelete }: Props) {
  const dangerLabel = isManual ? 'Supprimer' : 'Annuler la course'
  const DangerIcon = isManual ? Trash2 : XCircle

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-ink/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-paper w-full max-w-sm rounded-t-3xl md:rounded-3xl p-3 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <ul className="divide-y divide-warm-100">
          <Item icon={Eye} label="Voir le détail" onClick={onDetail} />
          <Item icon={Pencil} label="Modifier" onClick={onEdit} />
          <Item icon={DangerIcon} label={dangerLabel} danger onClick={onDelete} />
        </ul>
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
