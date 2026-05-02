'use client'
import { Icon } from '@/components/ui/Icon'
import { FieldRow, FieldLabel, FieldInput, WhenPill } from './posterMockupParts'
import { AddressLineInput } from './AddressLineInput'
import { PosterCpamBlock } from './PosterCpamBlock'
import { PosterFooter } from './PosterFooter'
import { PosterMicCta } from './PosterMicCta'
import type { usePosterCourse } from './usePosterCourse'

interface FooterProps {
  type: 'CPAM' | 'PRIVE'
  medicalMotif: ReturnType<typeof usePosterCourse>['form']['medicalMotif']
  returnTrip: boolean
  tpmr: boolean
  previewFare: ReturnType<typeof usePosterCourse>['previewFare']
  distanceKm: number | null
  durationMin: number | null
  loadingRoute: boolean
  saving: boolean
  canSubmit: boolean
  error: string | null
  onSubmit: () => void
}

interface Props {
  c: ReturnType<typeof usePosterCourse>
  footerProps: FooterProps
}

/**
 * Corps principal du formulaire de creation : type, adresses, quand,
 * patient/tel, bloc CPAM conditionnel, visibilite, remarques. Affiche aussi
 * le gros mic-CTA en haut. Monte uniquement apres que le sas Preflight
 * (groupe + type) ait ete valide.
 */
export function PosterCourseForm({ c, footerProps }: Props) {
  const { form } = c
  return (
    <>
      <div className="md:px-6 md:pt-2 lg:max-w-6xl lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
        <div>
          <div className="px-6 pt-4 pb-2 lg:px-0">
            <div className="text-[34px] lg:text-[56px] font-extrabold leading-[1.05] tracking-[-0.025em]">
              Nouvelle<br/><span className="text-warm-300">course</span>
            </div>
            <p className="hidden lg:block mt-4 text-[14px] text-warm-500 max-w-md leading-relaxed">
              Saisissez les détails de votre course. Le récapitulatif à droite se met à jour en direct, prêt à être publié.
            </p>
          </div>

          <PosterMicCta flow={c.voiceFlow} />

          <div className="px-6 lg:px-0">
            <div className="border-t border-warm-200">
              <FieldRow leadIcon={<span className="w-3 h-3 rounded-full bg-ink" />}>
                <AddressLineInput
                  label="Départ" placeholder="Adresse de prise en charge"
                  value={form.departure} onChange={form.setDeparture}
                  onSelectSuggestion={c.onSelectDeparture}
                />
              </FieldRow>
              <FieldRow leadIcon={<span className="w-3 h-3 rounded-sm" style={{ background: '#F0B800' }} />}>
                <AddressLineInput
                  label="Arrivée" placeholder="Adresse de dépose"
                  value={form.destination} onChange={form.setDestination}
                  onSelectSuggestion={c.onSelectDestination}
                />
              </FieldRow>

              <div className="grid grid-cols-[24px_1fr] gap-3.5 items-center py-4 border-b border-warm-200">
                <div className="flex items-center justify-center text-warm-500">
                  <Icon name="schedule" size={19} className="text-warm-500" />
                </div>
                <div className="min-w-0 flex flex-wrap items-center gap-2">
                  <FieldLabel>Quand</FieldLabel>
                  <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                    <WhenPill active={c.when === 'now'} onClick={() => c.setWhen('now')} icon="bolt" label="Maintenant" />
                    <WhenPill active={c.when === 'later'} onClick={() => c.setWhen('later')} icon="event" label="Plus tard" />
                  </div>
                </div>
              </div>
              {c.when === 'later' && (
                <div className="grid grid-cols-[24px_1fr] gap-3.5 items-center pt-3 pb-4 border-b border-warm-200">
                  <span aria-hidden="true" />
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <label className="flex items-center gap-2">
                      <span className="text-[11px] font-bold tracking-[0.04em] uppercase text-warm-400">Date</span>
                      <input
                        type="date" value={form.date} onChange={(e) => form.setDate(e.target.value)}
                        className="bg-transparent border-0 outline-none text-[15px] font-bold tracking-[-0.012em] text-ink"
                      />
                    </label>
                    <label className="flex items-center gap-2">
                      <span className="text-[11px] font-bold tracking-[0.04em] uppercase text-warm-400">Heure</span>
                      <input
                        type="time" value={form.time} onChange={(e) => form.setTime(e.target.value)}
                        className="bg-transparent border-0 outline-none text-[15px] font-bold tracking-[-0.012em] text-ink"
                      />
                    </label>
                  </div>
                </div>
              )}

              <FieldRow leadIcon={<Icon name="person" size={19} className="text-warm-500" />}>
                <FieldLabel>Patient</FieldLabel>
                <FieldInput value={form.patientName} onChange={form.setPatientName} placeholder="Nom du patient" autoComplete="off" />
                {form.type === 'CPAM' && !form.patientName.trim() && (
                  <span className="block mt-0.5 text-[11.5px] text-warm-400 font-medium">Obligatoire pour CPAM</span>
                )}
              </FieldRow>
              <FieldRow leadIcon={<Icon name="call" size={19} className="text-warm-500" />}>
                <FieldLabel>Téléphone</FieldLabel>
                <FieldInput value={form.phone} onChange={form.setPhone} placeholder="Pour le contacter à l'arrivée" type="tel" inputMode="tel" autoComplete="tel" />
              </FieldRow>
            </div>

            {form.type === 'CPAM' && (
              <PosterCpamBlock
                medicalMotif={form.medicalMotif} setMedicalMotif={form.setMedicalMotif}
                returnTrip={form.returnTrip} setReturnTrip={form.setReturnTrip}
                passengers={form.passengers} setPassengers={form.setPassengers}
                tpmr={c.tpmr} setTpmr={c.setTpmr}
              />
            )}

            <div className="pt-7 pb-3 flex items-baseline justify-between">
              <h2 className="text-[18px] font-extrabold tracking-[-0.015em]">Remarques</h2>
              <span className="text-[11.5px] text-warm-400 font-semibold">Facultatif</span>
            </div>
            <textarea
              value={form.notes} onChange={(e) => form.setNotes(e.target.value)}
              placeholder="Étage, code, particularité du patient, instructions pour le chauffeur…"
              rows={3}
              className="w-full bg-warm-100/60 border border-warm-200 rounded-[14px] px-3.5 py-3 text-[14px] font-medium text-ink placeholder:text-warm-400 placeholder:font-normal focus:outline-none focus:border-ink resize-none"
            />
          </div>
        </div>

        <aside className="hidden lg:block lg:sticky lg:top-6 lg:self-start">
          <PosterFooter {...footerProps} />
        </aside>
      </div>

      <div className="lg:hidden">
        <PosterFooter {...footerProps} />
      </div>
    </>
  )
}
