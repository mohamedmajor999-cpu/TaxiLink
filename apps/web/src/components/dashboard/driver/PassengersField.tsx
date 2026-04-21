'use client'
import { Minus, Plus } from 'lucide-react'
import { FieldCard } from './MissionFormPrimitives'

interface Props {
  value: number | null
  onChange: (v: number | null) => void
}

export function PassengersField({ value, onChange }: Props) {
  const current = value ?? 1
  const dec = () => onChange(Math.max(1, current - 1))
  const inc = () => onChange(Math.min(8, current + 1))

  return (
    <FieldCard label="Nombre de passagers — facultatif" filled={value !== null} compact>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={dec}
          disabled={current <= 1}
          className="w-9 h-9 rounded-full border border-warm-200 flex items-center justify-center hover:bg-warm-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Minus className="w-4 h-4 text-ink" strokeWidth={2} />
        </button>
        <span className="text-[18px] font-bold text-ink tabular-nums min-w-[2ch] text-center">{value ?? '—'}</span>
        <button
          type="button"
          onClick={inc}
          disabled={current >= 8}
          className="w-9 h-9 rounded-full border border-warm-200 flex items-center justify-center hover:bg-warm-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4 text-ink" strokeWidth={2} />
        </button>
        {value !== null && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="ml-auto text-[12px] text-warm-500 hover:text-ink underline"
          >
            Retirer
          </button>
        )}
      </div>
    </FieldCard>
  )
}
