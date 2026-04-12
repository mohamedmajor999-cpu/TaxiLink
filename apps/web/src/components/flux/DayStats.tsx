'use client'

import { useDriverStore } from '@/store/driverStore'
import { Icon } from '@/components/ui/Icon'

export function DayStats() {
  const { driver } = useDriverStore()

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard
        icon="directions_car"
        value={String(driver.todayRides ?? 0)}
        label="Courses"
        iconBg="bg-primary/20"
      />
      <StatCard
        icon="route"
        value={`${driver.todayKm ?? 0}`}
        label="km"
        iconBg="bg-accent/10"
        iconColor="text-accent"
      />
      <StatCard
        icon="euro"
        value={`${(driver.todayEarnings ?? 0).toFixed(0)}€`}
        label="Gains"
        iconBg="bg-primary/20"
        dark
      />
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
  iconBg,
  iconColor = 'text-secondary',
  dark = false,
}: {
  icon: string
  value: string
  label: string
  iconBg: string
  iconColor?: string
  dark?: boolean
}) {
  return (
    <div
      className={`rounded-2xl shadow-soft p-3 flex flex-col gap-1.5 ${
        dark ? 'bg-secondary' : 'bg-white'
      }`}
    >
      <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center`}>
        <Icon
          name={icon}
          size={15}
          className={dark ? 'text-primary' : iconColor}
        />
      </div>
      <div
        className={`text-2xl font-black leading-none ${
          dark ? 'text-primary' : 'text-secondary'
        }`}
      >
        {value}
      </div>
      <div
        className={`text-[10px] uppercase tracking-wider font-semibold ${
          dark ? 'text-white/40' : 'text-muted'
        }`}
      >
        {label}
      </div>
    </div>
  )
}
