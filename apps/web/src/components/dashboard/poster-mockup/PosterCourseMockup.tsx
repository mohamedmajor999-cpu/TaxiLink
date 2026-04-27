'use client'
import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import {
  Chip, FieldRow, FieldLabel, FieldInput, MicBtn, WhenPill,
  MicroLabel, SegMini, SegMiniBtn, Stepper, VisBtn, Checkbox,
} from './posterMockupParts'

type CourseType = 'STD' | 'CPAM'
type Visibility = 'GROUP' | 'PUBLIC'

const GROUPS = [
  { id: 'g1', name: 'Taxi Marseille 13', meta: '12 chauffeurs · 4 en ligne' },
  { id: 'g2', name: 'Conventionnés Sud 13', meta: '8 chauffeurs · 2 en ligne' },
]

export function PosterCourseMockup() {
  const [type, setType] = useState<CourseType>('CPAM')
  const [tpmr, setTpmr] = useState(false)
  const [vis, setVis] = useState<Visibility>('GROUP')
  const [groupSel, setGroupSel] = useState<string[]>(['g1'])
  const [when, setWhen] = useState<'now' | 'later'>('now')
  const [motif, setMotif] = useState<'HPJ' | 'CONS'>('HPJ')
  const [returnTrip, setReturnTrip] = useState(true)
  const [patients, setPatients] = useState(1)

  const toggleGroup = (id: string) =>
    setGroupSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  return (
    <div className="bg-paper min-h-[100dvh] pb-[180px] max-w-[480px] mx-auto" style={{ fontFeatureSettings: '"tnum"' }}>
      {/* Header */}
      <div className="px-6 pt-4 pb-1 flex items-center justify-between">
        <button aria-label="Fermer" className="w-9 h-9 rounded-full bg-warm-100 flex items-center justify-center -ml-2">
          <Icon name="close" size={22} />
        </button>
        <button className="h-9 pl-1.5 pr-3.5 rounded-full bg-ink text-paper flex items-center gap-2 text-[12.5px] font-bold shadow-[0_4px_12px_-2px_rgba(0,0,0,0.25)]">
          <span className="w-6 h-6 rounded-full bg-brand text-ink flex items-center justify-center motion-safe:animate-pulse">
            <Icon name="mic" size={14} />
          </span>
          Tout dicter
        </button>
      </div>

      {/* Title */}
      <div className="px-6 pt-4 pb-5">
        <div className="text-[34px] font-extrabold leading-[1.05] tracking-[-0.025em]">
          Nouvelle<br/><span className="text-warm-300">course</span>
        </div>
      </div>

      <div className="px-6">
        {/* Type chips */}
        <div className="flex gap-2 pb-5">
          <Chip active={type === 'STD'} onClick={() => setType('STD')} icon="local_taxi" label="Standard" />
          <Chip active={type === 'CPAM'} onClick={() => setType('CPAM')} icon="medical_services" label="CPAM" />
        </div>

        {/* Hairline fields */}
        <div className="border-t border-warm-200">
          <FieldRow leadIcon={<span className="w-3 h-3 rounded-full bg-ink" />} trail={<MicBtn />}>
            <FieldLabel>Départ</FieldLabel>
            <FieldInput defaultValue="Hôpital Nord, Marseille" placeholder="Adresse de prise en charge" />
          </FieldRow>

          <FieldRow leadIcon={<span className="w-3 h-3 rounded-sm" style={{ background: '#F0B800' }} />} trail={<MicBtn />}>
            <FieldLabel>Arrivée</FieldLabel>
            <FieldInput defaultValue="Castellane, Marseille" placeholder="Adresse de dépose" />
          </FieldRow>

          <FieldRow
            leadIcon={<Icon name="schedule" size={19} className="text-warm-500" />}
            trail={
              <>
                <WhenPill active={when === 'now'} onClick={() => setWhen('now')} icon="bolt" label="Maintenant" />
                <WhenPill active={when === 'later'} onClick={() => setWhen('later')} icon="event" label="Plus tard" />
              </>
            }
          >
            <FieldLabel>Quand</FieldLabel>
            <div className="text-[16px] font-bold tracking-tight">{when === 'now' ? 'Maintenant' : 'Plus tard'}</div>
          </FieldRow>

          <FieldRow leadIcon={<Icon name="person" size={19} className="text-warm-500" />}>
            <FieldLabel>Patient</FieldLabel>
            <FieldInput defaultValue="M. Dupont" placeholder="Nom du patient" />
            {type === 'CPAM' && <span className="block mt-0.5 text-[11.5px] text-warm-400 font-medium">Obligatoire pour CPAM</span>}
          </FieldRow>

          <FieldRow leadIcon={<Icon name="call" size={19} className="text-warm-500" />}>
            <FieldLabel>Téléphone</FieldLabel>
            <FieldInput placeholder="Pour le contacter à l'arrivée" type="tel" />
          </FieldRow>
        </div>

        {/* CPAM block */}
        {type === 'CPAM' && (
          <>
            <div className="pt-7 pb-3 flex items-baseline justify-between">
              <h2 className="text-[18px] font-extrabold tracking-[-0.015em]">Détails de la prescription</h2>
              <span className="text-[11.5px] text-warm-400 font-semibold">Pour le calcul du tarif</span>
            </div>
            <div className="-mx-6 px-6 py-4 border-l-[3px] border-brand bg-gradient-to-r from-brand/[0.12] to-transparent rounded-r-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-ink text-brand text-[9.5px] font-extrabold tracking-[0.12em] uppercase px-1.5 py-0.5 rounded">CPAM</span>
                <span className="text-[13px] font-bold">Indispensables au tarif conventionné</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <MicroLabel>Motif</MicroLabel>
                  <SegMini>
                    <SegMiniBtn active={motif === 'HPJ'} onClick={() => setMotif('HPJ')}>HPJ</SegMiniBtn>
                    <SegMiniBtn active={motif === 'CONS'} onClick={() => setMotif('CONS')}>Consultation</SegMiniBtn>
                  </SegMini>
                </div>
                <div>
                  <MicroLabel>Aller-retour</MicroLabel>
                  <SegMini>
                    <SegMiniBtn active={!returnTrip} onClick={() => setReturnTrip(false)}>Non</SegMiniBtn>
                    <SegMiniBtn active={returnTrip} onClick={() => setReturnTrip(true)}>Oui</SegMiniBtn>
                  </SegMini>
                </div>
                <div>
                  <MicroLabel>Patients</MicroLabel>
                  <Stepper value={patients} onChange={setPatients} />
                </div>
              </div>
              <button onClick={() => setTpmr((v) => !v)} className="mt-3 flex items-center gap-3 py-1 text-left">
                <Checkbox checked={tpmr} />
                <span className="text-[13px] font-semibold">
                  Patient en fauteuil roulant <span className="text-warm-400 ml-1">+30 € forfait</span>
                </span>
              </button>
            </div>
          </>
        )}

        {/* Visibilité */}
        <div className="pt-7 pb-3 flex items-baseline justify-between">
          <h2 className="text-[18px] font-extrabold tracking-[-0.015em]">À qui</h2>
          <span className="text-[11.5px] text-warm-400 font-semibold">Diffusion</span>
        </div>
        <div className="bg-warm-100 rounded-[14px] p-1 grid grid-cols-2 gap-1 mb-3">
          <VisBtn active={vis === 'GROUP'} onClick={() => setVis('GROUP')} icon="groups" label="Mes groupes" />
          <VisBtn active={vis === 'PUBLIC'} onClick={() => setVis('PUBLIC')} icon="public" label="Tous les chauffeurs" />
        </div>
        {vis === 'GROUP' && (
          <div>
            {GROUPS.map((g) => (
              <button key={g.id} onClick={() => toggleGroup(g.id)} className="w-full flex items-center gap-3 py-3 border-b border-warm-200 last:border-0 text-left">
                <Checkbox checked={groupSel.includes(g.id)} />
                <span className="flex-1 text-[14px] font-bold">{g.name}</span>
                <span className="text-[11.5px] text-warm-400 font-semibold">{g.meta}</span>
              </button>
            ))}
          </div>
        )}

        <button className="mt-5 flex items-center gap-2 py-1.5 text-[13px] font-bold">
          <Icon name="tune" size={18} className="text-warm-500" />
          Plus d&apos;options
          <span className="text-warm-400 font-semibold">· Accompagnant, notes, prix manuel</span>
        </button>
      </div>

      {/* Footer */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-paper/85 backdrop-blur-xl border-t border-warm-200 px-6 pt-3.5"
        style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))', WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}
      >
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-[10.5px] font-bold tracking-[0.12em] uppercase text-warm-400">Prix estimé</div>
            <div className="text-[36px] font-extrabold tracking-[-0.035em] leading-[0.95] mt-1">42,80 €</div>
            <span className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-700"></span>
              CPAM HPJ · Aller-retour
            </span>
          </div>
          <div className="text-right">
            <div className="text-[10.5px] font-bold tracking-[0.12em] uppercase text-warm-400">Trajet</div>
            <div className="text-[14px] font-bold mt-1">14,3 km</div>
            <div className="text-[14px] font-bold text-warm-500">22 min</div>
          </div>
        </div>
        <button className="w-full h-14 bg-ink text-paper rounded-2xl font-extrabold text-[15px] flex items-center justify-center gap-2.5 shadow-[0_12px_28px_-8px_rgba(0,0,0,0.45)]">
          Aperçu et publier
          <Icon name="arrow_forward" size={20} className="text-brand" />
        </button>
      </div>
    </div>
  )
}
