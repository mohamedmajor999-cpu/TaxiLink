'use client'

import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'

export type VehicleType = 'standard' | 'berline' | 'van' | 'electrique'

const VEHICLE_BUTTONS: { type: VehicleType; icon: string; label: string }[] = [
  { type: 'standard', icon: 'directions_car', label: 'Standard' },
  { type: 'berline', icon: 'electric_car', label: 'Berline' },
  { type: 'van', icon: 'airport_shuttle', label: 'Van' },
  { type: 'electrique', icon: 'ev_station', label: 'Électrique' },
]

export function VehicleSelector({
  value,
  onChange,
}: {
  value: VehicleType
  onChange: (v: VehicleType) => void
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-2 px-1">
        Type de véhicule
      </label>
      <div className="grid grid-cols-2 gap-2">
        {VEHICLE_BUTTONS.map(({ type, icon, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={cn(
              'w-full h-11 rounded-xl border-2 flex items-center justify-center gap-2 transition-all btn-ripple',
              value === type ? 'border-primary bg-primary/10' : 'border-line bg-white'
            )}
          >
            <Icon name={icon} size={16} className="text-secondary" />
            <span className="text-xs font-bold text-secondary">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
