'use client'
import { Settings } from 'lucide-react'
import { useDriverProfilScreen } from './profil/useDriverProfilScreen'
import { ProfileHero } from './profil/ProfileHero'
import { ProfileStatsCard } from './profil/ProfileStatsCard'
import { SettingsCompte } from './profil/SettingsCompte'
import { SettingsPreferences } from './profil/SettingsPreferences'
import { SettingsApp } from './profil/SettingsApp'

interface Props {
  driverName: string
  onLogout: () => void
}

export function DriverProfilScreen({ driverName, onLogout }: Props) {
  const s = useDriverProfilScreen(driverName)

  return (
    <div className="max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-2">
        <h1 className="text-[22px] font-bold text-ink leading-tight tracking-tight">
          Profil
        </h1>
        <button
          type="button"
          aria-label="Paramètres"
          className="w-10 h-10 rounded-full border border-warm-200 bg-paper flex items-center justify-center text-ink hover:bg-warm-50 transition-colors"
        >
          <Settings className="w-4 h-4" strokeWidth={1.8} />
        </button>
      </header>

      <ProfileHero
        fullName={s.fullName}
        initials={s.initials}
        isVerified
        proCardNumber="TX-2847"
      />

      <ProfileStatsCard
        monthLabel={s.monthlyStats.monthLabel}
        revenue={s.monthlyStats.revenue}
        courseCount={s.monthlyStats.courseCount}
        deltaPercent={s.monthlyStats.delta}
        previousMonthLabel={s.monthlyStats.previousMonthLabel}
      />

      <SettingsCompte driver={s.driver} />
      <SettingsPreferences />
      <SettingsApp onLogout={onLogout} />

      <p className="text-center text-[11px] text-warm-500 pt-2 pb-8">
        TaxiLink v1.0 · Fait à Marseille
      </p>
    </div>
  )
}
