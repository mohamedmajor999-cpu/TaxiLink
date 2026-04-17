'use client'
import { User, Car, Star, CreditCard } from 'lucide-react'
import { SettingItem } from '@/components/taxilink/SettingItem'
import type { Driver } from '@taxilink/core'

interface Props {
  driver: Driver
}

export function SettingsCompte({ driver }: Props) {
  return (
    <section className="bg-paper border border-warm-200 rounded-2xl overflow-hidden">
      <div className="px-5 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-warm-500">
        Compte
      </div>
      <SettingItem
        icon={<User className="w-full h-full" strokeWidth={1.6} />}
        label="Informations personnelles"
        description="Nom, téléphone, adresse"
      />
      <SettingItem
        icon={<Car className="w-full h-full" strokeWidth={1.6} />}
        label="Véhicule"
        description={driver.vehicle ? driver.vehicle : 'À renseigner'}
      />
      <SettingItem
        icon={<Star className="w-full h-full" strokeWidth={1.6} />}
        label="Note et avis"
        description={`${driver.rating.toFixed(1)} / 5 · ${driver.totalRides} avis`}
      />
      <SettingItem
        icon={<CreditCard className="w-full h-full" strokeWidth={1.6} />}
        label="Abonnement"
        description="Taxi13 · Gratuit"
        right={
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-brand text-ink text-[10px] font-bold uppercase tracking-wider">
            Actif
          </span>
        }
      />
    </section>
  )
}
