'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/Icon'
import { useDriverStore } from '@/store/driverStore'
import { useUnseenAcceptCount } from '@/store/postedAcceptStore'
import { MobileNavDrawer } from '@/components/taxilink/MobileNavDrawer'
import type { DriverTab } from '@/components/taxilink/navTypes'
import {
  Chip, FieldRow, FieldLabel, FieldInput, WhenPill, VisBtn, Checkbox,
} from './posterMockupParts'
import { AddressLineInput } from './AddressLineInput'
import { PosterCpamBlock } from './PosterCpamBlock'
import { PosterFooter } from './PosterFooter'
import { PosterHeader } from './PosterHeader'
import { PosterVoiceBanner } from './PosterVoiceBanner'
import { usePosterCourse } from './usePosterCourse'

function computeInitials(name: string): string {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'YB'
}

export function PosterCourseMockup() {
  const router = useRouter()
  const c = usePosterCourse()
  const { form } = c
  const { driver } = useDriverStore()
  const unseenAcceptCount = useUnseenAcceptCount()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const initials = computeInitials(driver.name || '')
  const goToTab = (tab: DriverTab) => router.push(`/dashboard/chauffeur?tab=${tab}`)

  return (
    <div className="bg-paper min-h-[100dvh] pb-[200px] max-w-[480px] mx-auto" style={{ fontFeatureSettings: '"tnum"' }}>
      <PosterHeader
        onMenu={() => setDrawerOpen(true)}
        hasNotif={unseenAcceptCount > 0}
        flow={c.voiceFlow}
      />
      <PosterVoiceBanner flow={c.voiceFlow} />

      <div className="px-6 pt-4 pb-5">
        <div className="text-[34px] font-extrabold leading-[1.05] tracking-[-0.025em]">
          Nouvelle<br/><span className="text-warm-300">course</span>
        </div>
      </div>

      <div className="px-6">
        <div className="text-[11px] font-bold tracking-[0.04em] uppercase text-warm-500 mb-2">Type de course</div>
        <div className="flex gap-2 pb-5">
          <Chip active={form.type === 'PRIVE'} onClick={() => form.setType('PRIVE')} icon="local_taxi" label="Standard" />
          <Chip active={form.type === 'CPAM'} onClick={() => form.setType('CPAM')} icon="medical_services" label="CPAM" />
        </div>

        <div className="mt-[5px] border-t border-warm-200">
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

      <PosterFooter
        type={form.type} medicalMotif={form.medicalMotif} returnTrip={form.returnTrip} tpmr={c.tpmr}
        previewFare={c.previewFare} distanceKm={c.distanceKm} durationMin={c.durationMin}
        loadingRoute={c.loadingRoute} saving={c.saving} canSubmit={c.canSubmit} error={c.error}
        onSubmit={c.submit}
      />

      <MobileNavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeTab={'home' as DriverTab}
        onTabChange={goToTab}
        onPostCourse={() => setDrawerOpen(false)}
        driverName={driver.name || 'Chauffeur'}
        driverInitials={initials}
        groupName="Taxi13"
        isOnline={driver.isOnline}
        badges={{ coursesNotif: unseenAcceptCount }}
      />
    </div>
  )
}
