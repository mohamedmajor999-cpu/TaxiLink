'use client'
import { FieldCard, Chip } from './MissionFormPrimitives'
import type { TransportType } from '@/lib/validators'

interface Props {
  value: TransportType | null
  onChange: (v: TransportType) => void
}

export function TransportTypeField({ value, onChange }: Props) {
  return (
    <FieldCard label="Type de transport" filled={value !== null}>
      <div className="flex flex-wrap gap-2">
        <Chip active={value === 'SEATED'} onClick={() => onChange('SEATED')}>Assis</Chip>
        <Chip active={value === 'WHEELCHAIR'} onClick={() => onChange('WHEELCHAIR')}>Fauteuil roulant</Chip>
        <Chip active={value === 'STRETCHER'} onClick={() => onChange('STRETCHER')}>Brancard</Chip>
      </div>
    </FieldCard>
  )
}
