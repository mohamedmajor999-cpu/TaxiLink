'use client'
import { Mic, X, ArrowRight, Loader2, AlertCircle, Navigation } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { useVoiceDictation } from '@/hooks/useVoiceDictation'
import { usePartagerMissionModal } from './usePartagerMissionModal'
import { MissionVisibilityField } from './MissionVisibilityField'
import { AddressField } from './AddressField'
import { FieldCard, Chip } from './MissionFormPrimitives'

interface Props {
  onClose: () => void
  mission?: Mission
}

export function PartagerMissionModal({ onClose, mission }: Props) {
  const {
    isEdit, type, setType, payment, setPayment,
    visibility, setVisibility, groupId, setGroupId, myGroups,
    departure, setDeparture, destination, setDestination,
    onSelectDeparture, onSelectDestination,
    distanceKm, durationMin, loadingRoute,
    time, setTime, price, setPrice, patientName, setPatientName,
    saving, error, canSubmit, submit,
  } = usePartagerMissionModal(onClose, mission)

  const voice = useVoiceDictation({
    lang: 'fr-FR',
    continuous: false,
    onFinalTranscript: (text) => setDeparture((prev) => (prev ? `${prev} ${text}`.trim() : text)),
  })

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
            <button
              type="button"
              disabled={!voice.isSupported}
              onClick={voice.isListening ? voice.stop : voice.start}
              aria-label={!voice.isSupported ? 'Non supporté par votre navigateur' : voice.isListening ? 'Arrêter la dictée' : 'Démarrer la dictée vocale'}
              title={!voice.isSupported ? 'Non supporté par votre navigateur' : undefined}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                !voice.isSupported
                  ? 'bg-warm-100 text-warm-500 cursor-not-allowed'
                  : voice.isListening
                    ? 'bg-brand text-ink'
                    : 'bg-warm-100 text-warm-500 hover:bg-warm-200'
              }`}
            >
              {voice.isListening && <span className="absolute inset-0 rounded-full bg-brand/40 animate-ping" />}
              <Mic className="relative w-8 h-8" strokeWidth={1.8} />
            </button>
            <p className="text-[13px] text-warm-500 min-h-[1.25rem] max-w-xs truncate">
              {voice.error
                ? 'Erreur micro'
                : voice.isListening
                  ? voice.interimTranscript || 'J\u2019\u00e9coute\u2026'
                  : 'Dict\u00e9e vocale'}
            </p>
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

          <AddressField
            label="Départ"
            placeholder="Ex : 12 rue de la République, Marseille"
            value={departure}
            onChange={setDeparture}
            onSelectSuggestion={onSelectDeparture}
            filled={departure.trim().length >= 5}
          />

          <AddressField
            label="Arrivée"
            placeholder="Ex : Hôpital Nord, Marseille"
            value={destination}
            onChange={setDestination}
            onSelectSuggestion={onSelectDestination}
            filled={destination.trim().length >= 5}
          />

          {(loadingRoute || (distanceKm !== null && durationMin !== null)) && (
            <div className="-mt-1 mb-3 flex items-center gap-1.5 text-[13px] text-warm-500">
              <Navigation className="w-3.5 h-3.5" strokeWidth={1.8} />
              {loadingRoute ? (
                <span>Calcul de l&apos;itinéraire…</span>
              ) : (
                <span>{distanceKm} km · {durationMin} min</span>
              )}
            </div>
          )}

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

          <MissionVisibilityField
            visibility={visibility}
            groupId={groupId}
            myGroups={myGroups}
            onSelectPublic={() => { setVisibility('PUBLIC'); setGroupId(null) }}
            onSelectGroup={(id) => { setVisibility('GROUP'); setGroupId(id) }}
          />

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

