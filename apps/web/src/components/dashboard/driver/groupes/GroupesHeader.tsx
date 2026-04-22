'use client'
import Image from 'next/image'
import { Plus, Link2 } from 'lucide-react'

interface Props {
  privateCount: number
  publicCount?: number
  onCreate:     () => void
  onJoin:       () => void
}

export function GroupesHeader({ privateCount, publicCount = 0, onCreate, onJoin }: Props) {
  const subtitle = publicCount > 0
    ? `${privateCount} privé${privateCount > 1 ? 's' : ''} · ${publicCount} public${publicCount > 1 ? 's' : ''}`
    : `${privateCount} privé${privateCount > 1 ? 's' : ''}`

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
