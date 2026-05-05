import type { PublicMission } from '@/services/publicMissionService'

interface Props {
  mission: PublicMission
  fareValue: number
}

function formatPrice(value: number): string {
  if (value <= 0) return '—'
  return `${value.toFixed(2).replace('.', ',')} €`
}

function formatHour(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Carte mission publique (page /c/[id]). Reproduit le style des annonces
 * du dashboard (timeline pointée jaune, badge type CPAM/Privé) avec un
 * en-tête sharer/groupe et un footer prix/trajet en off-white.
 */
export function PublicMissionCard({ mission: m, fareValue }: Props) {
  const isCpam = m.type === 'CPAM'
  const sharer = m.sharer
  const showGroup = m.visibility === 'GROUP' && !!m.groupName
  const distance = m.distance_km != null ? `${m.distance_km.toFixed(1).replace('.', ',')} km` : '—'
  const duration = m.duration_min != null ? `${Math.round(m.duration_min)} min` : null

  return (
    <article className="mt-6 rounded-[20px] bg-paper border border-warm-200 shadow-[0_2px_4px_rgba(0,0,0,0.02),0_12px_36px_-12px_rgba(0,0,0,0.18)] overflow-hidden">
      {sharer && (
        <header className="px-5 py-4 flex items-center gap-3 border-b border-warm-100">
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-full bg-[#FFD11A] flex items-center justify-center text-[14px] font-extrabold tracking-[-0.01em] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_4px_rgba(255,209,26,0.25)]">
              {sharer.initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-ink flex items-center justify-center border-2 border-paper">
              <svg viewBox="0 0 16 16" width="8" height="8" fill="#FFD11A" aria-hidden="true">
                <path d="M3 7l1-3h8l1 3h1v5h-2v1H4v-1H2V7h1zm2 0h6l-.6-2H5.6L5 7zm-1 2h2v1H4V9zm6 0h2v1h-2V9z" />
              </svg>
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-extrabold tracking-[-0.01em] leading-tight text-ink truncate">{sharer.fullName}</p>
            <p className="text-[11.5px] text-warm-500 font-medium leading-tight mt-0.5">a partagé cette course</p>
          </div>
          {showGroup && (
            <div className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-warm-100 text-warm-700 text-[10.5px] font-extrabold tracking-[0.02em] border border-warm-200">
              <svg viewBox="0 0 16 16" width="9" height="9" fill="currentColor" aria-hidden="true">
                <path d="M5.5 8a2 2 0 100-4 2 2 0 000 4zM2 13c0-2 1.5-3.5 3.5-3.5S9 11 9 13H2zm9-5a2 2 0 100-4 2 2 0 000 4zm0 1.5c-.6 0-1.1.1-1.6.3.6.5 1.1 1.3 1.4 2.2H14v-.5c0-1.1-1.3-2-3-2z" />
              </svg>
              <span className="truncate max-w-[120px]">{m.groupName}</span>
            </div>
          )}
        </header>
      )}

      <div className="px-5 pt-4">
        <div className="flex items-start justify-between gap-3">
          <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-[0.05em] ${isCpam ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#F3E8FF] text-[#6B21A8]'}`}>
            {isCpam ? 'CPAM' : 'Privé'}{m.return_trip ? ' · A/R' : ''}
          </span>
          <div className="flex items-center gap-1.5 text-[12px] font-bold text-warm-700">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
            </svg>
            {formatHour(m.scheduled_at)}
          </div>
        </div>

        <div className="mt-4 flex items-start gap-3.5">
          <div className="flex flex-col items-center gap-1.5 pt-1.5 flex-shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-ink" />
            <div className="w-0.5 h-9 bg-warm-200" />
            <div className="w-3 h-3 rounded-full bg-[#FFD11A] border-[2.5px] border-ink" />
          </div>
          <div className="space-y-3 min-w-0 flex-1">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-warm-400 leading-none mb-1">Départ</div>
              <p className="text-[14.5px] font-bold leading-tight text-ink">{m.departure}</p>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-warm-400 leading-none mb-1">Arrivée</div>
              <p className="text-[14.5px] font-bold leading-tight text-warm-700">{m.destination}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 px-5 py-4 bg-[#FAFAF7] border-t border-warm-200 flex items-end justify-between">
        <div>
          <p className="text-[10.5px] font-bold tracking-[0.12em] uppercase text-warm-500">Prix</p>
          <p className="text-[34px] font-extrabold tracking-[-0.03em] leading-[0.95] mt-1 text-ink">{formatPrice(fareValue)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10.5px] font-bold tracking-[0.12em] uppercase text-warm-500">Trajet</p>
          <p className="text-[14px] font-bold mt-1 text-ink">
            {distance}{duration && <span className="text-warm-500 font-medium"> · {duration}</span>}
          </p>
        </div>
      </div>
    </article>
  )
}
