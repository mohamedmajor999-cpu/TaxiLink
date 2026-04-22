'use client'
import { FieldCard } from './MissionFormPrimitives'

interface Props {
  value: boolean
  onChange: (v: boolean) => void
}

export function CompanionToggle({ value, onChange }: Props) {
  return (
    <FieldCard label="Accompagnant — facultatif" filled={value} compact>
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-ink cursor-pointer"
        />
        <span className="text-[13px] text-ink">
          Avec accompagnant (famille, aidant)
        </span>
      </label>
    </FieldCard>
  )
}
