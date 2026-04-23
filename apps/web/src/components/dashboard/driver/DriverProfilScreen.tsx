'use client'
import { useDriverProfilScreen } from './profil/useDriverProfilScreen'
import { ProfileHero } from './profil/ProfileHero'
import { ProfileStatsCard } from './profil/ProfileStatsCard'
import { SettingsCompte } from './profil/SettingsCompte'
import { SettingsPreferences } from './profil/SettingsPreferences'
import { DeptPreferencesCard } from './profil/DeptPreferencesCard'
import { SettingsApp } from './profil/SettingsApp'

interface Props {
  driverName: string
}

export function DriverProfilScreen({ driverName }: Props) {
  const s = useDriverProfilScreen(driverName)

  return (
    <div className="max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-2">
        <h1 className="text-[22px] font-bold text-ink leading-tight tracking-tight">
          Profil
        </h1>
      </header>

      <ProfileHero
        fullName={s.fullName}
        initials={s.initials}
        isVerified={s.isVerified}
        proCardNumber={s.proNumber ?? undefined}
      />

      <ProfileStatsCard
        monthLabel={s.monthlyStats.monthLabel}
        revenue={s.monthlyStats.revenue}
        courseCount={s.monthlyStats.courseCount}
        deltaPercent={s.monthlyStats.delta}
        previousMonthLabel={s.monthlyStats.previousMonthLabel}
      />

      <SettingsCompte />
      <SettingsPreferences />
      <DeptPreferencesCard />
      <SettingsApp />

      <p className="text-center text-[11px] text-warm-500 pt-2 pb-8">
        TaxiLink v1.0 · Fait à Marseille
      </p>
    </div>
  )
}
