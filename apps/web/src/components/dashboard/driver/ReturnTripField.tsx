'use client'
import { FieldCard } from './MissionFormPrimitives'

interface Props {
  returnTrip: boolean
  returnTime: string | null
  onToggle: (v: boolean) => void
  onTimeChange: (v: string | null) => void
}

export function ReturnTripField({ returnTrip, returnTime, onToggle, onTimeChange }: Props) {
  const handleToggle = (v: boolean) => {
    onToggle(v)
    if (!v) onTimeChange(null)
  }

  return (
    <FieldCard label="Aller-retour — facultatif" filled={returnTrip} compact>
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={returnTrip}
          onChange={(e) => handleToggle(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-ink cursor-pointer"
        />
        <span className="text-[13px] text-ink">Aller-retour (retour à prendre après la consultation)</span>
      </label>

      {returnTrip && (
        <div className="mt-3 pl-6">
          <label className="block text-[11px] font-semibold text-warm-500 mb-1">
            Heure de retour (facultatif)
          </label>
          <input
            type="time"
            value={returnTime ?? ''}
            onChange={(e) => onTimeChange(e.target.value || null)}
            className="h-10 px-3 rounded-xl border border-warm-200 focus:border-ink focus:outline-none text-[14px] text-ink tabular-nums transition-colors"
          />
        </div>
      )}
    </FieldCard>
  )
}
