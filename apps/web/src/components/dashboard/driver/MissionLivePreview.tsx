'use client'
import { CalendarDays, Clock, Eye, MapPin, Users, Stethoscope, Wallet, Navigation2, AlertCircle, ArrowRight } from 'lucide-react'
import type { usePartagerMissionModal } from './usePartagerMissionModal'

type FormCtx = ReturnType<typeof usePartagerMissionModal>

interface Props {
  f: FormCtx
  groupLabel: string | null
  scheduledAtIso: string | null
}

function formatScheduled(iso: string | null): { date: string; time: string; relative: string } | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const date = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const minutesAhead = Math.round((d.getTime() - Date.now()) / 60_000)
  const relative =
    minutesAhead < 0 ? 'Date passée'
    : minutesAhead < 60 ? `Dans ${minutesAhead} min`
    : minutesAhead < 60 * 24 ? `Dans ${Math.round(minutesAhead / 60)} h`
    : `Dans ${Math.round(minutesAhead / (60 * 24))} j`
  return { date, time, relative }
}

function formatPrice(value: number, min: number | null, max: number | null, isEstimated: boolean): string {
  if (min != null && max != null && min !== max) return `${min}–${max} €`
  if (value > 0) return `${isEstimated ? '~' : ''}${value} €`
  return '—'
}

export function MissionLivePreview({ f, groupLabel, scheduledAtIso }: Props) {
  const isCpam = f.type === 'CPAM'
  const hasDeparture = f.departure.trim().length >= 5
  const hasDestination = f.destination.trim().length >= 5
  const schedule = formatScheduled(scheduledAtIso)
  const priceLabel = formatPrice(f.previewFare.value, f.previewFare.min, f.previewFare.max, f.previewFare.isEstimated)
  const visibilityLabel =
    f.visibility === 'PUBLIC' ? 'Publique · tous les chauffeurs' :
    groupLabel ? groupLabel :
    f.groupIds.length > 0 ? `${f.groupIds.length} groupe${f.groupIds.length > 1 ? 's' : ''}` :
    'Groupe à choisir'

  return (
    <div className="rounded-2xl border border-warm-200 bg-paper overflow-hidden">
      <div className="bg-ink text-paper px-4 py-3">
        <div className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-brand">
          <Eye className="w-3 h-3" strokeWidth={2.4} />
          Aperçu en direct
        </div>
        <p className="mt-1 text-[12px] text-paper/65 leading-snug">
          Voilà ce que verront les autres chauffeurs.
        </p>
      </div>

      <div className="p-4 space-y-3.5">
        <div className="flex flex-wrap gap-1.5">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-extrabold uppercase tracking-[0.04em] ${
            isCpam ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
          }`}>
            {isCpam ? <Stethoscope className="w-3 h-3" strokeWidth={2.4} /> : <Users className="w-3 h-3" strokeWidth={2.4} />}
            {isCpam ? 'Médical' : 'Privé'}
          </span>
          {isCpam && f.medicalMotif && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-[0.04em] bg-warm-100 text-warm-700">
              {f.medicalMotif === 'HDJ' ? 'CPAM HDJ' : 'Consultation'}
            </span>
          )}
          {f.returnTrip && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-[0.04em] bg-warm-100 text-warm-700">
              Aller-retour
            </span>
          )}
        </div>

        <div className="rounded-xl bg-warm-50 p-3 space-y-2">
          <Row
            icon={<MapPin className="w-3.5 h-3.5 text-warm-500" strokeWidth={2.2} />}
            label="Départ"
            value={hasDeparture ? f.departure : <Placeholder>Adresse de départ</Placeholder>}
          />
          <div aria-hidden className="ml-1.5 w-px h-2 border-l-2 border-dotted border-warm-300" />
          <Row
            icon={<MapPin className="w-3.5 h-3.5 text-brand" strokeWidth={2.2} fill="currentColor" />}
            label="Arrivée"
            value={hasDestination ? f.destination : <Placeholder>Adresse d&apos;arrivée</Placeholder>}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Tile
            icon={<Navigation2 className="w-3 h-3" strokeWidth={2.2} />}
            label="Trajet"
            value={f.distanceKm != null && f.durationMin != null ? `${f.distanceKm} km · ${f.durationMin} min` : '—'}
          />
          <Tile
            icon={<Wallet className="w-3 h-3" strokeWidth={2.2} />}
            label="Prix"
            value={priceLabel}
            highlight
          />
          <Tile
            icon={<CalendarDays className="w-3 h-3" strokeWidth={2.2} />}
            label="Date"
            value={schedule?.date ?? '—'}
          />
          <Tile
            icon={<Clock className="w-3 h-3" strokeWidth={2.2} />}
            label={schedule ? schedule.relative : 'Heure'}
            value={schedule?.time ?? '—'}
          />
        </div>

        <div className="rounded-xl border border-warm-200 px-3 py-2.5 flex items-center gap-2 text-[12.5px]">
          <Eye className="w-3.5 h-3.5 text-warm-500 shrink-0" strokeWidth={2.2} />
          <span className="text-warm-500 font-semibold">Visible par</span>
          <span className="text-ink font-bold truncate ml-auto">{visibilityLabel}</span>
        </div>

        <button
          type="button"
          onClick={f.showPreview}
          disabled={!f.canSubmit}
          className="w-full h-12 rounded-xl bg-ink text-paper text-[13.5px] font-bold inline-flex items-center justify-center gap-2 hover:bg-warm-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {f.canSubmit ? 'Prévisualiser et publier' : 'Complétez les champs requis'}
          {f.canSubmit && <ArrowRight className="w-4 h-4" strokeWidth={2.4} />}
        </button>

        {!f.canSubmit && (
          <p className="text-[11px] text-warm-500 leading-relaxed flex items-start gap-1.5">
            <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" strokeWidth={2.2} />
            Renseignez le départ, l&apos;arrivée, la date et l&apos;heure pour activer la publication.
          </p>
        )}
      </div>
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-[9.5px] font-extrabold uppercase tracking-[0.08em] text-warm-500">{label}</div>
        <div className="text-[13px] font-semibold text-ink leading-snug break-words">{value}</div>
      </div>
    </div>
  )
}

function Tile({ icon, label, value, highlight = false }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl px-2.5 py-2 ${highlight ? 'bg-brand/15 border border-brand/30' : 'bg-warm-50'}`}>
      <div className="flex items-center gap-1 text-[9.5px] font-extrabold uppercase tracking-[0.06em] text-warm-500">
        {icon}
        {label}
      </div>
      <div className={`mt-0.5 text-[14px] font-extrabold tabular-nums leading-tight ${highlight ? 'text-ink' : 'text-ink'}`}>
        {value}
      </div>
    </div>
  )
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return <span className="text-warm-400 font-medium italic">{children}</span>
}
