'use client'
import type { Group } from '@taxilink/core'
import type { MissionVisibility } from '@/lib/validators'
import { Checkbox, VisBtn } from './posterMockupParts'

interface Props {
  visibility: MissionVisibility
  groupIds: string[]
  myGroups: Group[]
  setVisibility: (v: MissionVisibility) => void
  setGroupIds: (ids: string[]) => void
  toggleGroup: (id: string) => void
}

export function PosterVisibilitySection({
  visibility, groupIds, myGroups, setVisibility, setGroupIds, toggleGroup,
}: Props) {
  return (
    <>
      <div className="pt-7 pb-3 flex items-baseline justify-between">
        <h2 className="text-[18px] font-extrabold tracking-[-0.015em]">À qui</h2>
        <span className="text-[11.5px] text-warm-400 font-semibold">Diffusion</span>
      </div>
      <div className="bg-warm-100 rounded-[14px] p-1 grid grid-cols-2 gap-1 mb-3">
        <VisBtn active={visibility === 'GROUP'} onClick={() => setVisibility('GROUP')} icon="groups" label="Mes groupes" />
        <VisBtn active={visibility === 'PUBLIC'} onClick={() => { setVisibility('PUBLIC'); setGroupIds([]) }} icon="public" label="Tous les chauffeurs" />
      </div>
      {visibility === 'GROUP' && myGroups.length > 0 && (
        <div>
          {myGroups.map((g) => (
            <button
              key={g.id} type="button" onClick={() => toggleGroup(g.id)}
              className="w-full flex items-center gap-3 py-3 border-b border-warm-200 last:border-0 text-left"
            >
              <Checkbox checked={groupIds.includes(g.id)} />
              <span className="flex-1 text-[14px] font-bold">{g.name}</span>
              {typeof g.memberCount === 'number' && (
                <span className="text-[11.5px] text-warm-400 font-semibold">{g.memberCount} membres</span>
              )}
            </button>
          ))}
        </div>
      )}
      {visibility === 'GROUP' && myGroups.length === 0 && (
        <p className="py-3 text-[12.5px] text-warm-500">
          Vous n&apos;êtes encore dans aucun groupe. Choisissez « Tous les chauffeurs » pour publier.
        </p>
      )}
    </>
  )
}
