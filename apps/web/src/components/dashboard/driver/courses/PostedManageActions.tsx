'use client'
import { Edit3, TrendingUp, Trash2, Loader2, Ban } from 'lucide-react'

interface Props {
  isWaiting: boolean
  deleting: boolean
  boosting: boolean
  onEdit: () => void
  onBoost: () => void
  onDelete: () => void
}

export function PostedManageActions({
  isWaiting, deleting, boosting, onEdit, onBoost, onDelete,
}: Props) {
  return (
    <section className="border-t border-warm-100 pt-4 mt-2">
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-warm-400 mb-3">
        Gérer la course
      </p>
      {isWaiting ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onEdit}
            disabled={deleting}
            className="h-11 rounded-xl border border-warm-200 bg-paper text-ink text-[13px] font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            <Edit3 className="w-4 h-4" strokeWidth={2} />
            Modifier
          </button>
          <button
            type="button"
            onClick={onBoost}
            disabled={boosting || deleting}
            className="h-11 rounded-xl bg-brand text-ink text-[13px] font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {boosting
              ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
              : <TrendingUp className="w-4 h-4" strokeWidth={2} />}
            Booster +5€
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="col-span-2 h-11 rounded-xl bg-danger-soft text-danger text-[13px] font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {deleting
              ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
              : <Trash2 className="w-4 h-4" strokeWidth={2} />}
            Supprimer
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="w-full h-11 rounded-xl bg-danger-soft text-danger text-[13px] font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {deleting
            ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
            : <Ban className="w-4 h-4" strokeWidth={2} />}
          Annuler la course
        </button>
      )}
    </section>
  )
}
