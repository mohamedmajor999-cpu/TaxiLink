'use client'
import { Mic, X, Check, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { usePartagerMissionModal } from './usePartagerMissionModal'

interface Props {
  onClose: () => void
  mission?: Mission
}

export function PartagerMissionModal({ onClose, mission }: Props) {
  const {
    isEdit,
    type, setType,
    payment, setPayment,
    visible, toggleVisible,
    departure, setDeparture,
    destination, setDestination,
    time, setTime,
    price, setPrice,
    patientName, setPatientName,
    saving, error, canSubmit,
    submit,
  } = usePartagerMissionModal(onClose, mission)

  return (
    <div className="fixed inset-0 z-50 bg-paper overflow-y-auto md:static md:z-auto md:overflow-visible">
      <div className="bg-paper w-full min-h-screen md:min-h-0">
        <header className="sticky top-0 bg-paper z-10 px-5 py-4 border-b border-warm-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-ink rounded-lg flex items-center justify-center shrink-0">
              <div className="w-3 h-3 bg-brand rounded-sm" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[18px] font-bold text-ink leading-tight tracking-tight">
                {isEdit ? 'Modifier la course' : 'Nouvelle course'}
              </h2>
              <p className="text-[12px] text-warm-500 mt-0.5 truncate">
                {isEdit ? 'Mettez à jour les informations de la course' : 'Remplissez les informations ci-dessous'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="w-9 h-9 rounded-lg bg-warm-100 flex items-center justify-center text-ink hover:bg-warm-200 transition-colors shrink-0">
            <X className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </header>

        <div className="px-5 md:px-8 py-8 max-w-2xl mx-auto">
          <div className="flex flex-col items-center text-center gap-2 mb-8">
            <button type="button" disabled aria-label="Dicter (bientôt disponible)" className="relative w-20 h-20 rounded-full bg-warm-100 flex items-center justify-center text-warm-500 cursor-not-allowed">
              <Mic className="w-8 h-8" strokeWidth={1.8} />
            </button>
            <p className="text-[13px] text-warm-500">Dictée vocale bientôt disponible</p>
          </div>

          <h3 className="text-[11px] font-bold uppercase tracking-wider text-warm-500 mb-3">Type de course</h3>
          <FieldCard filled={true}>
            <div className="flex gap-2">
              <Chip active={type === 'CPAM'} onClick={() => setType('CPAM')}>Médical</Chip>
              <Chip active={type === 'PRIVE'} onClick={() => setType('PRIVE')}>Privé</Chip>
            </div>
          </FieldCard>

          {type === 'CPAM' && (
            <FieldCard label="Nom du patient" filled={patientName.trim().length > 0}>
              <input
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Ex : Jean Dupont"
                className="w-full h-10 px-3 rounded-xl border border-warm-200 focus:border-ink focus:outline-none text-[14px] text-ink transition-colors"
              />
            </FieldCard>
          )}

          <FieldCard label="Départ" filled={departure.trim().length >= 5}>
            <input
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              placeholder="Ex : 12 rue de la République, Marseille"
              className="w-full h-10 px-3 rounded-xl border border-warm-200 focus:border-ink focus:outline-none text-[14px] text-ink transition-colors"
            />
          </FieldCard>

          <FieldCard label="Arrivée" filled={destination.trim().length >= 5}>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Ex : Hôpital Nord, Marseille"
              className="w-full h-10 px-3 rounded-xl border border-warm-200 focus:border-ink focus:outline-none text-[14px] text-ink transition-colors"
            />
          </FieldCard>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <FieldCard label="Heure" filled={/^\d{1,2}:\d{2}$/.test(time.trim())} compact>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-warm-200 focus:border-ink focus:outline-none text-[18px] font-bold text-ink tabular-nums tracking-tight transition-colors"
              />
            </FieldCard>
            <FieldCard label="Prix (€)" filled={price.trim().length > 0} compact>
              <input
                type="number"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="38"
                min={0}
                max={500}
                className="w-full h-10 px-3 rounded-xl border border-warm-200 focus:border-ink focus:outline-none text-[18px] font-bold text-ink tabular-nums tracking-tight transition-colors"
              />
            </FieldCard>
          </div>

          <FieldCard label="Paiement" filled>
            <div className="flex flex-wrap gap-2">
              <Chip active={payment === 'CPAM'} onClick={() => setPayment('CPAM')}>CPAM</Chip>
              <Chip active={payment === 'CASH'} onClick={() => setPayment('CASH')}>Espèces</Chip>
              <Chip active={payment === 'CB'} onClick={() => setPayment('CB')}>CB</Chip>
            </div>
          </FieldCard>

          <FieldCard label="Visible par">
            <div className="flex flex-wrap gap-2">
              <Chip dot active={visible.has('taxi13')} onClick={() => toggleVisible('taxi13')}>Taxi13</Chip>
              <Chip active={visible.has('allo')} onClick={() => toggleVisible('allo')}>+ Allo Taxi Marseille</Chip>
              <Chip active={visible.has('public')} onClick={() => toggleVisible('public')}>+ Public</Chip>
            </div>
          </FieldCard>

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-2xl border border-danger/30 bg-danger-soft p-3 text-[13px] text-danger">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="mt-6 w-full h-14 rounded-2xl bg-ink text-paper text-[15px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-warm-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                {isEdit ? 'Enregistrement…' : 'Publication…'}
              </>
            ) : (
              <>
                {isEdit ? 'Enregistrer' : 'Publier la course'}
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function FieldCard({
  label, children, filled = false, compact = false,
}: { label?: string; children: React.ReactNode; filled?: boolean; compact?: boolean }) {
  return (
    <div className={`rounded-2xl border border-warm-200 bg-paper mb-3 ${compact ? 'p-3' : 'p-4'}`}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-warm-500">{label}</span>
          {filled && (
            <span className="w-5 h-5 rounded-full bg-brand flex items-center justify-center">
              <Check className="w-3 h-3 text-ink" strokeWidth={2.5} />
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

function Chip({
  active, children, onClick, dot = false,
}: { active: boolean; children: React.ReactNode; onClick?: () => void; dot?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[13px] font-semibold transition-colors ${
        active ? 'bg-ink text-paper' : 'bg-paper text-ink border border-warm-200 hover:bg-warm-50'
      }`}
    >
      {active && dot && <span className="w-1.5 h-1.5 rounded-full bg-brand" />}
      {children}
    </button>
  )
}
