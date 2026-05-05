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
  onSubmitAndShare: () => void
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
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-paper/85 backdrop-blur-xl border-t border-warm-200 px-6 pt-3.5
                 lg:static lg:bottom-auto lg:left-auto lg:translate-x-0 lg:max-w-none lg:bg-paper lg:backdrop-blur-none
                 lg:rounded-3xl lg:border lg:border-warm-200 lg:p-6 lg:shadow-[0_8px_28px_-12px_rgba(0,0,0,0.18)]"
      style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))', WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}
    >
      <div className="hidden lg:flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-warm-500 mb-3">
        <Icon name="receipt_long" size={14} />
        Récapitulatif
      </div>
      <div className="flex items-end justify-between mb-3 lg:flex-col lg:items-start lg:gap-4">
        <div>
          <div className="text-[10.5px] font-bold tracking-[0.12em] uppercase text-warm-400">
            {p.previewFare.isEstimated ? 'Prix estimé' : 'Prix'}
          </div>
          <div className="text-[36px] lg:text-[44px] font-extrabold tracking-[-0.035em] leading-[0.95] mt-1">{priceLabel}</div>
          {p.type === 'CPAM' && (
            <span className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-700"></span>
              {motifLabel}{p.returnTrip ? ' · Aller-retour' : ''}{p.tpmr ? ' · TPMR' : ''}
            </span>
          )}
        </div>
        <div className="text-right lg:text-left lg:w-full lg:grid lg:grid-cols-2 lg:gap-3 lg:pt-3 lg:border-t lg:border-warm-200">
          <div className="lg:rounded-xl lg:bg-warm-50 lg:px-3 lg:py-2">
            <div className="text-[10.5px] font-bold tracking-[0.12em] uppercase text-warm-400">Distance</div>
            <div className="text-[14px] lg:text-[16px] font-bold mt-1">{distanceLabel}</div>
          </div>
          <div className="lg:rounded-xl lg:bg-warm-50 lg:px-3 lg:py-2">
            <div className="hidden lg:block text-[10.5px] font-bold tracking-[0.12em] uppercase text-warm-400">Durée</div>
            <div className="text-[14px] lg:text-[16px] font-bold lg:mt-1 text-warm-500 lg:text-ink">{durationLabel}</div>
          </div>
        </div>
      </div>
      {p.error && (
        <div className="mb-2 px-3 py-2 rounded-xl bg-danger-soft text-danger text-[12.5px] font-semibold">{p.error}</div>
      )}
      <button
        type="button"
        onClick={p.onSubmitAndShare}
        disabled={!p.canSubmit}
        className="w-full h-14 bg-[#25D366] text-paper rounded-2xl font-extrabold text-[15px] flex items-center justify-center gap-2.5 shadow-[0_12px_28px_-8px_rgba(37,211,102,0.45)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1FB856] transition-colors"
      >
        {p.saving ? 'Publication…' : 'Publier et partager sur WhatsApp'}
        {!p.saving && (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
            <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.2-.7.2-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4 0 1.4 1 2.7 1.2 2.9.1.2 2 3 4.8 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4 0-.1-.2-.2-.5-.4zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.4 1.3 4.9L2 22l5.3-1.4c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z"/>
          </svg>
        )}
      </button>
      <button
        type="button"
        onClick={p.onSubmit}
        disabled={!p.canSubmit}
        className="w-full mt-2 h-12 bg-paper border border-warm-300 text-ink rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-warm-50 transition-colors"
      >
        {p.saving ? 'Publication…' : 'Publier sans partager'}
      </button>
      <p className="hidden lg:block mt-3 text-[11.5px] text-warm-500 leading-relaxed">
        Une fois publiée, votre annonce apparaît instantanément aux chauffeurs ciblés.
      </p>
    </div>
  )
}
