'use client'
import type { Mission } from '@/lib/supabase/types'
import { formatEur } from '@/lib/formatters'
import { formatDateWithYear, formatTime } from '@/lib/dateUtils'

interface Props {
  mission: Mission
  driverName: string
  driverPhone: string | null
  proNumber: string | null
}

export function InvoiceReceipt({ mission, driverName, driverPhone, proNumber }: Props) {
  const date = mission.completed_at ?? mission.scheduled_at
  const amount = Number(mission.price_eur ?? 0)

  return (
    <div className="print-only bg-paper text-ink">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[12px] uppercase tracking-[0.18em] text-warm-500 font-semibold">Reçu de course</p>
          <h2 className="text-[26px] font-bold mt-1">TaxiLink</h2>
        </div>
        <div className="text-right text-[12px] text-warm-600">
          <p>N° {mission.id.slice(0, 8).toUpperCase()}</p>
          <p>{formatDateWithYear(date)}</p>
          <p>{formatTime(date)}</p>
        </div>
      </div>

      <section className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.14em] text-warm-500 font-semibold mb-2">Chauffeur</p>
        <p className="text-[14px] font-semibold">{driverName}</p>
        {proNumber && <p className="text-[12px] text-warm-600">N° professionnel : {proNumber}</p>}
        {driverPhone && <p className="text-[12px] text-warm-600">{driverPhone}</p>}
      </section>

      <section className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.14em] text-warm-500 font-semibold mb-2">Trajet</p>
        <div className="text-[13px] leading-6">
          <p><span className="text-warm-500">Départ : </span>{mission.departure}</p>
          <p><span className="text-warm-500">Arrivée : </span>{mission.destination}</p>
          {mission.distance_km != null && (
            <p><span className="text-warm-500">Distance : </span>{Number(mission.distance_km).toFixed(1)} km</p>
          )}
          {mission.duration_min != null && (
            <p><span className="text-warm-500">Durée : </span>{mission.duration_min} min</p>
          )}
        </div>
      </section>

      {(mission.type || mission.medical_motif) && (
        <section className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.14em] text-warm-500 font-semibold mb-2">Détails</p>
          <div className="text-[13px]">
            {mission.type && <p><span className="text-warm-500">Type : </span>{mission.type}</p>}
            {mission.medical_motif && <p><span className="text-warm-500">Motif : </span>{mission.medical_motif}</p>}
            {mission.patient_name && <p><span className="text-warm-500">Patient : </span>{mission.patient_name}</p>}
          </div>
        </section>
      )}

      <section className="border-t border-warm-300 pt-4 mt-8 flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-warm-500 font-semibold">Montant total</p>
          <p className="text-[12px] text-warm-600 mt-0.5">TVA non applicable, art. 293 B du CGI</p>
        </div>
        <p className="text-[28px] font-bold tabular-nums">{formatEur(amount)}</p>
      </section>

      <p className="text-[11px] text-warm-500 mt-12">
        Document généré automatiquement par TaxiLink. Conservez ce reçu pour vos remboursements ou
        votre comptabilité.
      </p>
    </div>
  )
}
