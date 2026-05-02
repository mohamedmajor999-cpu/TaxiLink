'use client'
import Image from 'next/image'
import { Plus, Link2 } from 'lucide-react'

interface Props {
  totalCount:    number
  favoriteCount: number
  onCreate:      () => void
  onJoin:        () => void
}

export function GroupesHeader({ totalCount, favoriteCount, onCreate, onJoin }: Props) {
  const subtitle = totalCount === 0
    ? 'Aucun groupe'
    : favoriteCount > 0
      ? `${totalCount} groupe${totalCount > 1 ? 's' : ''} · ${favoriteCount} favori${favoriteCount > 1 ? 's' : ''}`
      : `${totalCount} groupe${totalCount > 1 ? 's' : ''}`

  return (
    <header className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-2.5 min-w-0">
        <Image src="/brand/icon.svg" alt="TaxiLink" width={40} height={40} className="w-10 h-10 shrink-0" />
        <div className="min-w-0">
          <h1 className="text-[20px] font-bold text-ink leading-tight tracking-tight">
            Mes groupes
          </h1>
          <p className="text-[12px] text-warm-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onJoin}
          aria-label="Rejoindre un groupe avec un code"
          title="Rejoindre avec un code"
          className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-warm-200 bg-paper text-ink hover:bg-warm-50 transition-colors"
        >
          <Link2 className="w-4 h-4" strokeWidth={1.8} />
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
