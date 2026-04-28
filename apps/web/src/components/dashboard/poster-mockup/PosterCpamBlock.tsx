'use client'
import { MicroLabel, SegMini, SegMiniBtn, Stepper, Checkbox } from './posterMockupParts'
import type { MedicalMotif } from '@/lib/validators'

interface Props {
  medicalMotif: MedicalMotif | null
  setMedicalMotif: (m: MedicalMotif | null) => void
  returnTrip: boolean
  setReturnTrip: (v: boolean) => void
  passengers: number | null
  setPassengers: (v: number | null) => void
  tpmr: boolean
  setTpmr: (v: boolean) => void
}

export function PosterCpamBlock(p: Props) {
  return (
    <>
      <div className="pt-7 pb-3 flex items-baseline justify-between">
        <h2 className="text-[18px] font-extrabold tracking-[-0.015em]">Détails de la prescription</h2>
        <span className="text-[11.5px] text-warm-400 font-semibold">Pour le calcul du tarif</span>
      </div>
      <div className="-mx-6 px-6 py-4 border-l-[3px] border-brand bg-gradient-to-r from-brand/[0.12] to-transparent rounded-r-2xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-ink text-brand text-[9.5px] font-extrabold tracking-[0.12em] uppercase px-1.5 py-0.5 rounded">CPAM</span>
          <span className="text-[13px] font-bold">Indispensables au tarif conventionné</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <MicroLabel>Motif</MicroLabel>
            <SegMini>
              <SegMiniBtn active={p.medicalMotif === 'HDJ'} onClick={() => p.setMedicalMotif('HDJ')}>HDJ</SegMiniBtn>
              <SegMiniBtn active={p.medicalMotif === 'CONSULTATION'} onClick={() => p.setMedicalMotif('CONSULTATION')}>Consultation</SegMiniBtn>
            </SegMini>
          </div>
          <div>
            <MicroLabel>Aller-retour</MicroLabel>
            <SegMini>
              <SegMiniBtn active={!p.returnTrip} onClick={() => p.setReturnTrip(false)}>Non</SegMiniBtn>
              <SegMiniBtn active={p.returnTrip} onClick={() => p.setReturnTrip(true)}>Oui</SegMiniBtn>
            </SegMini>
          </div>
          <div>
            <MicroLabel>Patients</MicroLabel>
            <Stepper value={p.passengers ?? 1} onChange={p.setPassengers} />
          </div>
        </div>
        <button type="button" onClick={() => p.setTpmr(!p.tpmr)} className="mt-3 flex items-center gap-3 py-1 text-left">
          <Checkbox checked={p.tpmr} />
          <span className="text-[13px] font-semibold">
            Patient en fauteuil roulant <span className="text-warm-400 ml-1">+30 € forfait</span>
          </span>
        </button>
      </div>
    </>
  )
}
