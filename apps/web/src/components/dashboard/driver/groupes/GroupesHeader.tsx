'use client'
import { Plus, Link2 } from 'lucide-react'

interface Props {
  count:     number
  onCreate:  () => void
  onJoin:    () => void
}

export function GroupesHeader({ count, onCreate, onJoin }: Props) {
  return (
    <header className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-10 h-10 bg-ink rounded-xl flex items-center justify-center shrink-0">
          <div className="w-3 h-3 bg-brand rounded-sm" />
        </div>
        <div className="min-w-0">
          <h1 className="text-[20px] font-bold text-ink leading-tight tracking-tight">
            Mes groupes
          </h1>
          <p className="text-[12px] text-warm-500 mt-0.5">
            {count} groupe{count > 1 ? 's' : ''} rejoint{count > 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onJoin}
          className="inline-flex items-center gap-1.5 h-10 px-3 rounded-full border border-warm-200 bg-paper text-[13px] font-semibold text-ink hover:bg-warm-50 transition-colors"
        >
          <Link2 className="w-4 h-4" strokeWidth={1.8} />
          Rejoindre
        </button>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-paper text-[13px] font-semibold hover:bg-warm-800 transition-colors"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          Créer
        </button>
      </div>
    </header>
  )
}
