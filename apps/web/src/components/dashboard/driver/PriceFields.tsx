'use client'
import type { MedicalMotif } from '@/lib/validators'
import type { MissionFormType } from './missionFormHelpers'
import { FieldCard } from './MissionFormPrimitives'
import { FareEstimateButton } from './FareEstimateButton'

interface Props {
  type: MissionFormType
  medicalMotif: MedicalMotif | null
  price: string
  setPrice: (v: string) => void
  priceMin: string
  setPriceMin: (v: string) => void
  priceMax: string
  setPriceMax: (v: string) => void
  distanceKm: number | null
  durationMin: number | null
  date: string
  time: string
  departure: string
  destination: string
}

export function PriceFields(p: Props) {
  if (p.type === 'PRIVE') {
    const filled = p.priceMin.trim().length > 0 && p.priceMax.trim().length > 0
    const showEstimate = !p.priceMin.trim() && !p.priceMax.trim()
    return (
      <FieldCard label="Prix (€) — fourchette publiée au destinataire" filled={filled} compact>
        <div className="grid grid-cols-2 gap-3">
          <PriceInput label="Min" placeholder="Retour en charge" value={p.priceMin} onChange={p.setPriceMin} />
          <PriceInput label="Max" placeholder="Retour à vide" value={p.priceMax} onChange={p.setPriceMax} />
        </div>
        <p className="mt-1.5 text-[11px] text-warm-500">
          Min = retour en charge, Max = retour à vide. Tu peux aussi renseigner deux fois la même valeur pour un prix fixe.
        </p>
        {showEstimate && (
          <FareEstimateButton
            type={p.type} medicalMotif={p.medicalMotif}
            distanceKm={p.distanceKm} durationMin={p.durationMin}
            date={p.date} time={p.time}
            departure={p.departure} destination={p.destination}
            onEstimate={(v) => { p.setPriceMin(String(v)); p.setPriceMax(String(v)) }}
            onEstimateRange={(min, max) => { p.setPriceMin(String(min)); p.setPriceMax(String(max)) }}
          />
        )}
      </FieldCard>
    )
  }

  return (
    <FieldCard label="Prix (€) — facultatif" filled={p.price.trim().length > 0} compact>
      <input
        type="number" inputMode="decimal"
        value={p.price} onChange={(e) => p.setPrice(e.target.value)}
        placeholder="Laisser vide ou indiquer un prix"
        min={0} max={500}
        className="w-full h-10 px-3 rounded-xl border border-warm-200 focus:border-ink focus:outline-none text-[18px] font-bold text-ink tabular-nums tracking-tight transition-colors"
      />
      {p.price.trim().length === 0 && (
        <FareEstimateButton
          type={p.type} medicalMotif={p.medicalMotif}
          distanceKm={p.distanceKm} durationMin={p.durationMin}
          date={p.date} time={p.time}
          departure={p.departure} destination={p.destination}
          onEstimate={(v) => p.setPrice(String(v))}
        />
      )}
    </FieldCard>
  )
}

function PriceInput({
  label, placeholder, value, onChange,
}: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold uppercase tracking-wider text-warm-500 mb-1">{label}</span>
      <input
        type="number" inputMode="decimal"
        value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={0} max={500}
        className="w-full h-10 px-3 rounded-xl border border-warm-200 focus:border-ink focus:outline-none text-[16px] font-bold text-ink tabular-nums tracking-tight transition-colors"
      />
    </label>
  )
}
