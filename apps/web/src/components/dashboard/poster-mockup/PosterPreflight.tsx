'use client'
import { useEffect, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import type { Group } from '@taxilink/core'
import type { MissionVisibility } from '@/lib/validators'
import type { MissionFormType } from '@/components/dashboard/driver/missionFormHelpers'

interface Props {
  myGroups: Group[]
  type: MissionFormType
  visibility: MissionVisibility
  groupIds: string[]
  onChangeType: (t: MissionFormType) => void
  onSelectPublic: () => void
  onSelectGroupMode: () => void
  onToggleGroup: (id: string) => void
  defaultsRemembered: boolean
  onContinue: (rememberAsDefault: boolean) => void
}

/**
 * Etape de pre-vol : oblige le chauffeur a choisir un (ou plusieurs) groupe
 * et le type avant que le micro et le formulaire ne soient utilisables.
 * Les valeurs sont prechargees depuis les prereglages utilisateur si dispo.
 */
export function PosterPreflight({
  myGroups, type, visibility, groupIds,
  onChangeType, onSelectPublic, onSelectGroupMode, onToggleGroup,
  defaultsRemembered, onContinue,
}: Props) {
  const [remember, setRemember] = useState(defaultsRemembered)
  useEffect(() => { setRemember(defaultsRemembered) }, [defaultsRemembered])

  const visibilityOk = visibility === 'PUBLIC' || (visibility === 'GROUP' && groupIds.length > 0)
  const canContinue = visibilityOk

  return (
    <div className="px-6 pt-2 pb-8 lg:px-0 lg:max-w-xl">
      <div className="mb-6">
        <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-warm-500 mb-1">Étape 1/2</p>
        <h2 className="text-[24px] lg:text-[32px] font-extrabold leading-tight tracking-[-0.02em]">
          À qui partager,<br/><span className="text-warm-300">et quel type ?</span>
        </h2>
        <p className="mt-2 text-[13.5px] text-warm-500 leading-relaxed">
          Choisis le groupe et le type. Le micro et les autres champs s’ouvriront ensuite.
        </p>
      </div>

      <section className="mb-5">
        <h3 className="text-[12px] font-bold uppercase tracking-[0.06em] text-warm-500 mb-2">À qui</h3>
        <div className="bg-warm-100 rounded-[14px] p-1 grid grid-cols-2 gap-1 mb-2">
          <button
            type="button"
            onClick={onSelectGroupMode}
            className={`flex items-center justify-center gap-1.5 h-11 rounded-[10px] text-[13px] font-bold transition-colors ${
              visibility === 'GROUP' ? 'bg-paper text-ink shadow-sm' : 'text-warm-500 hover:text-ink'
            }`}
          >
            <Icon name="groups" size={18} />
            Mes groupes
          </button>
          <button
            type="button"
            onClick={onSelectPublic}
            className={`flex items-center justify-center gap-1.5 h-11 rounded-[10px] text-[13px] font-bold transition-colors ${
              visibility === 'PUBLIC' ? 'bg-paper text-ink shadow-sm' : 'text-warm-500 hover:text-ink'
            }`}
          >
            <Icon name="public" size={18} />
            Tous chauffeurs
          </button>
        </div>

        {visibility === 'GROUP' && myGroups.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {myGroups.map((g) => {
              const checked = groupIds.includes(g.id)
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onToggleGroup(g.id)}
                  className={`w-full flex items-center gap-3 py-3 px-3.5 rounded-xl border text-left transition-colors ${
                    checked ? 'bg-ink/5 border-ink' : 'bg-paper border-warm-200 hover:border-warm-300'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                    checked ? 'bg-ink' : 'bg-paper border-2 border-warm-300'
                  }`}>
                    {checked && <Icon name="check" size={14} className="text-paper" />}
                  </span>
                  <span className="flex-1 text-[14px] font-bold text-ink">{g.name}</span>
                  {typeof g.memberCount === 'number' && (
                    <span className="text-[11.5px] text-warm-400 font-semibold">{g.memberCount} membres</span>
                  )}
                </button>
              )
            })}
            {groupIds.length === 0 && (
              <p className="mt-2 text-[12.5px] text-danger font-semibold">Sélectionnez au moins un groupe.</p>
            )}
          </div>
        )}
        {visibility === 'GROUP' && myGroups.length === 0 && (
          <p className="mt-2 text-[12.5px] text-warm-500">
            Aucun groupe. Choisis « Tous chauffeurs » pour publier.
          </p>
        )}
      </section>

      <section className="mb-5">
        <h3 className="text-[12px] font-bold uppercase tracking-[0.06em] text-warm-500 mb-2">Type de course</h3>
        <div className="grid grid-cols-2 gap-2">
          <TypeCard
            active={type === 'PRIVE'}
            onClick={() => onChangeType('PRIVE')}
            iconName="local_taxi"
            title="Standard"
            sub="Privé"
          />
          <TypeCard
            active={type === 'CPAM'}
            onClick={() => onChangeType('CPAM')}
            iconName="medical_services"
            title="CPAM"
            sub="Médical"
          />
        </div>
      </section>

      <label className="flex items-start gap-3 px-1 py-2 cursor-pointer select-none mb-3">
        <span
          className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
            remember ? 'bg-ink border-ink' : 'bg-paper border-warm-300'
          }`}
        >
          {remember && <Icon name="check" size={14} className="text-paper" />}
        </span>
        <input
          type="checkbox"
          className="sr-only"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
        />
        <span className="text-[13px] text-ink leading-tight">
          Mémoriser comme préréglage
          <span className="block text-[11.5px] text-warm-500 mt-0.5">
            Pré-sélectionné à la prochaine création.
          </span>
        </span>
      </label>

      <button
        type="button"
        onClick={() => onContinue(remember)}
        disabled={!canContinue}
        className="w-full h-14 rounded-2xl bg-ink text-paper text-[15px] font-bold inline-flex items-center justify-center gap-2 hover:bg-warm-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continuer
        <Icon name="arrow_forward" size={18} />
      </button>
    </div>
  )
}

function TypeCard({
  active, onClick, iconName, title, sub,
}: { active: boolean; onClick: () => void; iconName: string; title: string; sub: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-1.5 p-4 rounded-2xl border-2 transition-colors ${
        active ? 'bg-ink text-paper border-ink' : 'bg-paper text-ink border-warm-200 hover:bg-warm-50'
      }`}
    >
      <span className={active ? 'text-brand' : 'text-warm-500'}>
        <Icon name={iconName} size={22} />
      </span>
      <span className="text-[16px] font-bold leading-none">{title}</span>
      <span className={`text-[11px] uppercase tracking-wide font-semibold ${active ? 'text-paper/70' : 'text-warm-500'}`}>{sub}</span>
    </button>
  )
}
