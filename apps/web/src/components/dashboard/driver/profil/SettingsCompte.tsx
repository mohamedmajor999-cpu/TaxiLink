'use client'
import { User, Car, TrendingUp } from 'lucide-react'
import { SettingItem } from '@/components/taxilink/SettingItem'
import type { Driver } from '@taxilink/core'

interface Props {
  driver: Driver
}

export function SettingsCompte({ driver }: Props) {
  return (
    <section className="mb-5">
      <SectionLabel>Compte</SectionLabel>
      <div className="flex flex-col gap-2">
        <SettingItem
          icon={<User className="w-full h-full" strokeWidth={1.8} />}
          label="Mes infos"
          description="Nom, carte pro, véhicule"
        />
        <SettingItem
          icon={<Car className="w-full h-full" strokeWidth={1.8} />}
          label="Mon véhicule"
          description={driver.vehicle ? driver.vehicle : 'À renseigner'}
        />
        <SettingItem
          icon={<TrendingUp className="w-full h-full" strokeWidth={1.8} />}
          label="Mes gains"
          description="Stats, export pour compta"
        />
      </div>
    </section>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-warm-500 px-1 mb-2">
      {children}
    </p>
  )
}
