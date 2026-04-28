'use client'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/Icon'
import {
  Chip, FieldRow, FieldLabel, FieldInput, WhenPill, VisBtn, Checkbox,
} from './posterMockupParts'
import { AddressLineInput } from './AddressLineInput'
import { PosterCpamBlock } from './PosterCpamBlock'
import { PosterFooter } from './PosterFooter'
import { PosterHeader } from './PosterHeader'
import { usePosterCourse } from './usePosterCourse'
import { GuidedMissionFlow } from '@/components/dashboard/driver/guided/GuidedMissionFlow'

export function PosterCourseMockup() {
  const router = useRouter()
  const c = usePosterCourse()
  const { form } = c

  if (c.completerIds) {
    return (
      <div className="bg-paper min-h-[100dvh] max-w-[480px] mx-auto" style={{ fontFeatureSettings: '"tnum"' }}>
        <div className="px-6 pt-4 pb-1 flex items-center justify-between">
          <button
            type="button" aria-label="Revenir au formulaire" onClick={c.closeCompleter}
            className="w-9 h-9 rounded-full bg-warm-100 flex items-center justify-center -ml-2"
          >
            <Icon name="arrow_back" size={22} />
          </button>
          <span className="text-[12px] font-semibold text-warm-500">Compléter par la voix</span>
        </div>
        <GuidedMissionFlow
          form={c.form}
          myGroups={c.myGroups}
          setters={c.guidedSetters}
          restrictToIds={c.completerIds}
          onComplete={c.closeCompleter}
        />
      </div>
    )
  }

  return (
    <div className="bg-paper min-h-[100dvh] pb-[200px] max-w-[480px] mx-auto" style={{ fontFeatureSettings: '"tnum"' }}>
      <PosterHeader onBack={() => router.back()} voice={c.voice} />

      <div className="px-6 pt-4 pb-5">
        <div className="text-[34px] font-extrabold leading-[1.05] tracking-[-0.025em]">
          Nouvelle<br/><span className="text-warm-300">course</span>
        </div>
      </div>

      <div className="px-6">
        <div className="flex gap-2 pb-5">
          <Chip active={form.type === 'PRIVE'} onClick={() => form.setType('PRIVE')} icon="local_taxi" label="Standard" />
          <Chip active={form.type === 'CPAM'} onClick={() => form.setType('CPAM')} icon="medical_services" label="CPAM" />
        </div>

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

          <FieldRow
            leadIcon={<Icon name="schedule" size={19} className="text-warm-500" />}
            trail={
              <>
                <WhenPill active={c.when === 'now'} onClick={() => c.setWhen('now')} icon="bolt" label="Maintenant" />
                <WhenPill active={c.when === 'later'} onClick={() => c.setWhen('later')} icon="event" label="Plus tard" />
              </>
            }
          >
            <FieldLabel>Quand</FieldLabel>
            <div className="text-[16px] font-bold tracking-tight">
              {c.when === 'now' ? 'Maintenant' : 'À une date précise'}
            </div>
          </FieldRow>
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
          <h2 className="text-[18px] font-extrabold tracking-[-0.015em]">À qui</h2>
          <span className="text-[11.5px] text-warm-400 font-semibold">Diffusion</span>
        </div>
        <div className="bg-warm-100 rounded-[14px] p-1 grid grid-cols-2 gap-1 mb-3">
          <VisBtn active={form.visibility === 'GROUP'} onClick={() => form.setVisibility('GROUP')} icon="groups" label="Mes groupes" />
          <VisBtn active={form.visibility === 'PUBLIC'} onClick={() => { form.setVisibility('PUBLIC'); form.setGroupIds([]) }} icon="public" label="Tous les chauffeurs" />
        </div>
        {form.visibility === 'GROUP' && c.myGroups.length > 0 && (
          <div>
            {c.myGroups.map((g) => (
              <button key={g.id} type="button" onClick={() => c.toggleGroup(g.id)}
                className="w-full flex items-center gap-3 py-3 border-b border-warm-200 last:border-0 text-left">
                <Checkbox checked={form.groupIds.includes(g.id)} />
                <span className="flex-1 text-[14px] font-bold">{g.name}</span>
                {typeof g.memberCount === 'number' && (
                  <span className="text-[11.5px] text-warm-400 font-semibold">{g.memberCount} membres</span>
                )}
              </button>
            ))}
          </div>
        )}
        {form.visibility === 'GROUP' && c.myGroups.length === 0 && (
          <p className="py-3 text-[12.5px] text-warm-500">Vous n&apos;êtes encore dans aucun groupe. Choisissez « Tous les chauffeurs » pour publier.</p>
        )}
      </div>

      <PosterFooter
        type={form.type} medicalMotif={form.medicalMotif} returnTrip={form.returnTrip} tpmr={c.tpmr}
        previewFare={c.previewFare} distanceKm={c.distanceKm} durationMin={c.durationMin}
        loadingRoute={c.loadingRoute} saving={c.saving} canSubmit={c.canSubmit} error={c.error}
        onSubmit={c.submit}
      />
    </div>
  )
}
