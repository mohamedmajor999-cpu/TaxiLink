'use client'
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
    <div className="max-w-4xl mx-auto">
      <ProfileHero
        fullName={s.fullName}
        initials={s.initials}
        isVerified
        rating={s.driver.rating}
        totalRides={s.driver.totalRides}
      />

      <ProfileStatsCard
        monthLabel={s.monthlyStats.monthLabel}
        revenue={s.monthlyStats.revenue}
        deltaPercent={s.monthlyStats.delta}
        weeks={s.monthlyStats.weeks}
        courseCount={s.monthlyStats.courseCount}
        kmTotal={s.monthlyStats.kmTotal}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SettingsCompte driver={s.driver} />
        <SettingsPreferences />
        <SettingsApp onLogout={onLogout} />
      </div>

      <p className="text-center text-[11px] text-warm-500 pt-6 pb-10">
        TaxiLink v1.0 · Fait à Marseille 🌊
      </p>
    </div>
  )
}
