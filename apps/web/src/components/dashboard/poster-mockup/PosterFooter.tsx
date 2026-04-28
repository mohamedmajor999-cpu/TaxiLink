'use client'
import { Icon } from '@/components/ui/Icon'
import type { MissionFormType } from '@/components/dashboard/driver/missionFormHelpers'
import type { MedicalMotif } from '@/lib/validators'

interface Props {
  type: MissionFormType
  medicalMotif: MedicalMotif | null
  returnTrip: boolean
  tpmr: boolean
  previewFare: { value: number; isEstimated: boolean }
  distanceKm: number | null
  durationMin: number | null
  loadingRoute: boolean
  saving: boolean
  canSubmit: boolean
  error: string | null
  onSubmit: () => void
}

export function PosterFooter(p: Props) {
  const priceLabel = p.previewFare.value > 0
    ? `${p.previewFare.value.toFixed(2).replace('.', ',')} €`
    : '—'
  const motifLabel = p.medicalMotif === 'HDJ' ? 'CPAM HDJ' : p.medicalMotif === 'CONSULTATION' ? 'CPAM Consultation' : 'CPAM'
  const distanceLabel = p.loadingRoute ? '…' : p.distanceKm != null ? `${p.distanceKm.toFixed(1).replace('.', ',')} km` : '—'
  const durationLabel = p.loadingRoute ? '…' : p.durationMin != null ? `${Math.round(p.durationMin)} min` : '—'

  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-paper/85 backdrop-blur-xl border-t border-warm-200 px-6 pt-3.5"
      style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))', WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}
    >
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="text-[10.5px] font-bold tracking-[0.12em] uppercase text-warm-400">
            {p.previewFare.isEstimated ? 'Prix estimé' : 'Prix'}
          </div>
          <div className="text-[36px] font-extrabold tracking-[-0.035em] leading-[0.95] mt-1">{priceLabel}</div>
          {p.type === 'CPAM' && (
            <span className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-700"></span>
              {motifLabel}{p.returnTrip ? ' · Aller-retour' : ''}{p.tpmr ? ' · TPMR' : ''}
            </span>
          )}
        </div>
        <div className="text-right">
          <div className="text-[10.5px] font-bold tracking-[0.12em] uppercase text-warm-400">Trajet</div>
          <div className="text-[14px] font-bold mt-1">{distanceLabel}</div>
          <div className="text-[14px] font-bold text-warm-500">{durationLabel}</div>
        </div>
      </div>
      {p.error && (
        <div className="mb-2 px-3 py-2 rounded-xl bg-danger-soft text-danger text-[12.5px] font-semibold">{p.error}</div>
      )}
      <button
        type="button"
        onClick={p.onSubmit}
        disabled={!p.canSubmit}
        className="w-full h-14 bg-ink text-paper rounded-2xl font-extrabold text-[15px] flex items-center justify-center gap-2.5 shadow-[0_12px_28px_-8px_rgba(0,0,0,0.45)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {p.saving ? 'Publication…' : 'Publier la course'}
        {!p.saving && <Icon name="arrow_forward" size={20} className="text-brand" />}
      </button>
    </div>
  )
}
