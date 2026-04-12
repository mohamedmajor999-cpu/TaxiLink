'use client'

import { Icon } from '@/components/ui/Icon'

type AgendaDayStatsProps = {
  rides: number
  km: number
  earnings: number
}

export function AgendaDayStats({ rides, km, earnings }: AgendaDayStatsProps) {
  const items = [
    { icon: 'directions_car', v: rides,                    l: 'Courses',  bg: 'bg-white',     vc: 'text-secondary' },
    { icon: 'route',          v: `${km.toFixed(0)} km`,    l: 'Distance', bg: 'bg-white',     vc: 'text-secondary' },
    { icon: 'euro',           v: `${earnings.toFixed(0)}€`, l: 'Gains',   bg: 'bg-secondary', vc: 'text-primary'   },
  ]
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((s) => (
        <div key={s.l} className={`${s.bg} rounded-2xl shadow-soft p-4`}>
          <Icon name={s.icon} size={18} className={s.vc} />
          <div className={`text-2xl font-black mt-1 ${s.vc}`}>{s.v}</div>
          <div className={`text-xs font-semibold uppercase tracking-wide mt-0.5 ${
            s.bg === 'bg-secondary' ? 'text-white/40' : 'text-muted'
          }`}>{s.l}</div>
        </div>
      ))}
    </div>
  )
}
