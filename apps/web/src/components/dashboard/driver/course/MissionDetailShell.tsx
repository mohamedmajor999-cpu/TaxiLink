'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export function MissionDetailShell({ children, onBack }: { children: React.ReactNode; onBack?: () => void }) {
  const router = useRouter()
  return (
    <div className="px-4 md:px-8 py-3 md:py-6 max-w-2xl md:max-w-3xl mx-auto pb-24 md:pb-6">
      <header className="mb-3">
        <button
          type="button"
          onClick={() => (onBack ? onBack() : router.back())}
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-warm-600 hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          Retour
        </button>
      </header>
      {children}
    </div>
  )
}

export function MissionDetailStat({ label, value, sub, border = false }: { label: string; value: string; sub?: string; border?: boolean }) {
  return (
    <div className={`px-2 sm:px-3 py-3 text-center ${border ? 'border-l border-warm-200' : ''}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-warm-500 mb-0.5">{label}</p>
      <p className="text-[14px] sm:text-[16px] md:text-[20px] font-bold text-ink tabular-nums tracking-tight leading-none truncate">{value}</p>
      {sub && <p className="text-[10px] text-warm-500 mt-1 truncate">{sub}</p>}
    </div>
  )
}
