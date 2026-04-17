'use client'
import { Check, Star } from 'lucide-react'

interface Props {
  fullName: string
  initials: string
  isVerified: boolean
  proCardNumber?: string
}

export function ProfileHero({ fullName, initials, isVerified, proCardNumber }: Props) {
  return (
    <section className="flex flex-col items-center text-center pt-1 pb-6">
      <div className="relative mb-4">
        <div className="w-[96px] h-[96px] rounded-full bg-ink text-brand grid place-items-center text-[28px] font-semibold tracking-tight">
          {initials}
        </div>
        {isVerified && (
          <span
            className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-brand border-[3px] border-paper grid place-items-center"
            title="Chauffeur vérifié"
          >
            <Check className="w-3.5 h-3.5 text-ink" strokeWidth={3} />
          </span>
        )}
      </div>
      <h1 className="text-[22px] font-bold text-ink leading-tight tracking-tight">
        {fullName}
      </h1>
      <p className="text-[13px] text-warm-500 mt-1">
        Chauffeur professionnel · Marseille
      </p>
      {isVerified && (
        <span className="mt-3 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-brand-soft border border-brand/40 text-[12px] font-medium text-ink">
          <Star className="w-3.5 h-3.5" strokeWidth={2} />
          Carte pro vérifiée{proCardNumber ? ` · #${proCardNumber}` : ''}
        </span>
      )}
    </section>
  )
}
