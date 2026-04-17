'use client'
import { Check } from 'lucide-react'
import { Chip } from '@/components/taxilink/Chip'

interface Props {
  fullName: string
  initials: string
  isVerified: boolean
  rating: number
  totalRides: number
  onEdit?: () => void
}

export function ProfileHero({
  fullName, initials, isVerified, rating, totalRides, onEdit,
}: Props) {
  return (
    <section className="bg-paper border border-warm-200 rounded-2xl p-6 shadow-soft mb-5">
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <div className="w-[72px] h-[72px] rounded-full bg-warm-100 grid place-items-center font-semibold text-[22px] text-ink">
            {initials}
          </div>
          {isVerified && (
            <div
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand border-[2.5px] border-paper grid place-items-center"
              title="Chauffeur vérifié"
            >
              <Check className="w-3 h-3 text-ink" strokeWidth={3} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-[30px] leading-none text-ink mb-1 truncate">
            {fullName}
          </h1>
          <p className="text-[13px] text-warm-600 mb-3">
            Chauffeur indépendant · Marseille
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Chip>Taxi13</Chip>
            <Chip>Allo Taxi Marseille</Chip>
            <Chip variant="accent">★ {rating.toFixed(1)} · {totalRides} course{totalRides > 1 ? 's' : ''}</Chip>
          </div>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 h-9 px-4 rounded-lg border border-warm-300 text-sm font-semibold text-ink hover:bg-warm-50 transition-colors"
        >
          Modifier
        </button>
      </div>
    </section>
  )
}
