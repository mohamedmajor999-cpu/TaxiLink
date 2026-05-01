'use client'
import Image from 'next/image'
import { HistoryTab } from '../courses/HistoryTab'

export function DriverStatsScreen() {
  return (
    <div className="relative px-4 md:px-8 pt-[calc(56px+env(safe-area-inset-top))] pb-24 md:pt-6 md:pb-6 max-w-2xl md:max-w-5xl mx-auto">
      <header className="flex items-center gap-3 mb-5">
        <Image src="/brand/icon.svg" alt="TaxiLink" width={40} height={40} className="w-9 h-9 md:w-10 md:h-10 shrink-0" />
        <div>
          <h1 className="text-[18px] md:text-[22px] font-bold text-ink leading-tight tracking-tight">
            Statistiques
          </h1>
          <p className="text-[12px] md:text-[13px] text-warm-500 mt-0.5">
            Historique, gains et performance
          </p>
        </div>
      </header>

      <HistoryTab />
    </div>
  )
}
