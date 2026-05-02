'use client'
import { ArrowRight, Stethoscope, User, Globe, Users, Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Group } from '@taxilink/core'
import type { MissionVisibility } from '@/lib/validators'
import type { MissionFormType } from './missionFormHelpers'

interface Props {
  myGroups: Group[]
  type: MissionFormType
  visibility: MissionVisibility
  groupIds: string[]
  onChangeType: (t: MissionFormType) => void
  onSelectPublic: () => void
  onToggleGroup: (id: string) => void
  defaultsRemembered: boolean
  onContinue: (rememberAsDefault: boolean) => void
}

/**
 * Étape de pré-vol : oblige le chauffeur à choisir le groupe (ou public) et
 * le type de course (Médical CPAM / Privé) avant de débloquer le micro et le
 * formulaire principal. Les défauts sont préchargés depuis les préréglages
 * sauvegardés ; un toggle permet de mémoriser le choix courant pour les
 * prochaines annonces.
 */
export function MissionPreflight({
  myGroups, type, visibility, groupIds,
  onChangeType, onSelectPublic, onToggleGroup,
  defaultsRemembered, onContinue,
}: Props) {
  const [remember, setRemember] = useState(defaultsRemembered)
  useEffect(() => { setRemember(defaultsRemembered) }, [defaultsRemembered])

  const visibilityOk = visibility === 'PUBLIC' || (visibility === 'GROUP' && groupIds.length > 0)
  const canContinue = visibilityOk

  return (
    <div className="px-4 md:px-8 py-4 max-w-2xl mx-auto">
      <section className="rounded-3xl border border-warm-200 bg-paper p-5 mb-4">
        <header className="mb-3">
          <h3 className="text-[14px] font-bold text-ink leading-tight">À qui partager ?</h3>
          <p className="text-[11.5px] text-warm-500 mt-0.5">Choisissez un ou plusieurs groupes, ou publiez en public.</p>
        </header>

        <div className="flex flex-wrap gap-2">
          <PillButton
            active={visibility === 'PUBLIC'}
            onClick={onSelectPublic}
            icon={<Globe className="w-3.5 h-3.5" strokeWidth={2.2} />}
          >
            Public
          </PillButton>
          {myGroups.map((g) => {
            const isActive = visibility === 'GROUP' && groupIds.includes(g.id)
            return (
              <PillButton
                key={g.id}
                active={isActive}
                onClick={() => onToggleGroup(g.id)}
                icon={<Users className="w-3.5 h-3.5" strokeWidth={2.2} />}
              >
                {g.name}
              </PillButton>
            )
          })}
        </div>

        {myGroups.length === 0 && (
          <p className="mt-3 text-[12px] text-warm-500">
            Rejoignez un groupe pour partager avec vos collègues.
          </p>
        )}
        {visibility === 'GROUP' && groupIds.length === 0 && myGroups.length > 0 && (
          <p className="mt-3 text-[12px] text-danger">Sélectionnez au moins un groupe.</p>
        )}
      </section>

      <section className="rounded-3xl border border-warm-200 bg-paper p-5 mb-4">
        <header className="mb-3">
          <h3 className="text-[14px] font-bold text-ink leading-tight">Type de course</h3>
          <p className="text-[11.5px] text-warm-500 mt-0.5">Médical (CPAM) ou course privée standard.</p>
        </header>
        <div className="grid grid-cols-2 gap-2">
          <TypeCard
            active={type === 'CPAM'}
            onClick={() => onChangeType('CPAM')}
            icon={<Stethoscope className="w-5 h-5" strokeWidth={2} />}
            title="Médical"
            sub="CPAM"
          />
          <TypeCard
            active={type === 'PRIVE'}
            onClick={() => onChangeType('PRIVE')}
            icon={<User className="w-5 h-5" strokeWidth={2} />}
            title="Privé"
            sub="Standard"
          />
        </div>
      </section>

      <label className="flex items-start gap-3 px-1 py-2 cursor-pointer select-none">
        <span
          className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
            remember ? 'bg-ink border-ink' : 'bg-paper border-warm-300'
          }`}
        >
          {remember && <Check className="w-3 h-3 text-paper" strokeWidth={3} />}
        </span>
        <input
          type="checkbox"
          className="sr-only"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
        />
        <span className="text-[13px] text-ink leading-tight">
          Mémoriser ce groupe et ce type comme préréglage
          <span className="block text-[11.5px] text-warm-500 mt-0.5">
            Ils seront pré-sélectionnés à la prochaine création.
          </span>
        </span>
      </label>

      <button
        type="button"
        onClick={() => onContinue(remember)}
        disabled={!canContinue}
        className="mt-4 w-full h-14 rounded-2xl bg-ink text-paper text-[15px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-warm-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continuer
        <ArrowRight className="w-4 h-4" strokeWidth={2} />
      </button>
    </div>
  )
}

function PillButton({
  active, onClick, icon, children,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[13px] font-semibold transition-colors ${
        active ? 'bg-ink text-paper' : 'bg-paper text-ink border border-warm-200 hover:bg-warm-50'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

function TypeCard({
  active, onClick, icon, title, sub,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-1.5 p-4 rounded-2xl border-2 transition-colors ${
        active ? 'bg-ink text-paper border-ink' : 'bg-paper text-ink border-warm-200 hover:bg-warm-50'
      }`}
    >
      <span className={active ? 'text-brand' : 'text-warm-500'}>{icon}</span>
      <span className="text-[15px] font-bold leading-none">{title}</span>
      <span className={`text-[11px] uppercase tracking-wide font-semibold ${active ? 'text-paper/70' : 'text-warm-500'}`}>{sub}</span>
    </button>
  )
}
