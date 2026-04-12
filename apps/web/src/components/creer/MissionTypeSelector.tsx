'use client'

import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'

export type MissionType = 'prive' | 'cpam'

const TYPE_BUTTONS: { type: MissionType; icon: string; label: string }[] = [
  { type: 'prive', icon: 'lock', label: 'Privé' },
  { type: 'cpam', icon: 'medical_services', label: 'CPAM' },
]

export function MissionTypeSelector({
  value,
  onChange,
}: {
  value: MissionType
  onChange: (t: MissionType) => void
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-2 px-1">
        Type de course
      </label>
      <div className="grid grid-cols-2 gap-2">
        {TYPE_BUTTONS.map(({ type, icon, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={cn(
              'w-full h-11 rounded-xl border-2 flex items-center justify-center gap-2 transition-all btn-ripple',
              value === type ? 'border-primary bg-primary/10' : 'border-line bg-white'
            )}
          >
            <Icon name={icon} size={16} className={type === 'cpam' ? 'text-green-600' : 'text-secondary'} />
            <span className="text-xs font-bold text-secondary">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
