'use client'

import { Chip } from '../MissionFormPrimitives'
import type { ChoiceOption } from './guidedTypes'

interface Props {
  options: ChoiceOption[]
  value: unknown
  onChange: (value: string) => void
}

export function GuidedChoiceInput({ options, value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Chip key={o.value} active={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </Chip>
      ))}
    </div>
  )
}

interface BooleanProps {
  value: unknown
  onChange: (value: boolean) => void
}

export function GuidedBooleanInput({ value, onChange }: BooleanProps) {
  return (
    <div className="flex gap-2">
      <Chip active={value === true} onClick={() => onChange(true)}>Oui</Chip>
      <Chip active={value === false} onClick={() => onChange(false)}>Non</Chip>
    </div>
  )
}

interface PassengersProps {
  value: unknown
  onChange: (value: number) => void
}

export function GuidedPassengersInput({ value, onChange }: PassengersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
        <Chip key={n} active={value === n} onClick={() => onChange(n)}>{n}</Chip>
      ))}
    </div>
  )
}
