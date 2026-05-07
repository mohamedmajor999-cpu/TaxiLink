'use client'
import { MicroLabel, Stepper } from './publierCourseParts'

interface Props {
  passengers: number | null
  setPassengers: (v: number | null) => void
  extraBagages: number
  setExtraBagages: (v: number) => void
  extraEncombrants: number
  setExtraEncombrants: (v: number) => void
}

export function PosterPriveSupplementsBlock(p: Props) {
  return (
    <>
      <div className="pt-7 pb-3 flex items-baseline justify-between">
        <h2 className="text-[18px] font-extrabold tracking-[-0.015em]">Suppléments</h2>
        <span className="text-[11.5px] text-warm-400 font-semibold">Facultatif — arrêté préfectoral</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <MicroLabel>Passagers</MicroLabel>
          <Stepper value={p.passengers ?? 1} onChange={(v) => p.setPassengers(v)} min={1} />
          <p className="mt-1 text-[10.5px] text-warm-400 font-medium leading-tight">5ᵉ et + : 4 €/pers.</p>
        </div>
        <div>
          <MicroLabel>Bagages 4ᵉ +</MicroLabel>
          <Stepper value={p.extraBagages} onChange={p.setExtraBagages} min={0} />
          <p className="mt-1 text-[10.5px] text-warm-400 font-medium leading-tight">2 € / bagage</p>
        </div>
        <div>
          <MicroLabel>Encombrants</MicroLabel>
          <Stepper value={p.extraEncombrants} onChange={p.setExtraEncombrants} min={0} />
          <p className="mt-1 text-[10.5px] text-warm-400 font-medium leading-tight">2 € / pièce</p>
        </div>
      </div>
    </>
  )
}
