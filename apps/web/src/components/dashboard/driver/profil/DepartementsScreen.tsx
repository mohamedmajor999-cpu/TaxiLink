'use client'
import { ArrowLeft } from 'lucide-react'
import { DeptPreferencesCard } from './DeptPreferencesCard'

interface Props {
  onBack: () => void
}

export function DepartementsScreen({ onBack }: Props) {
  return (
    <div className="max-w-2xl mx-auto">
      <header className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour"
          className="w-9 h-9 rounded-full grid place-items-center hover:bg-warm-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-ink" strokeWidth={2} />
        </button>
        <h1 className="text-[20px] font-bold text-ink leading-tight tracking-tight">
          Départements couverts
        </h1>
      </header>

      <DeptPreferencesCard />
    </div>
  )
}
