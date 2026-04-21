'use client'
import { Check } from 'lucide-react'
import type { Group } from '@taxilink/core'
import type { MissionVisibility } from '@/lib/validators'

interface Props {
  visibility: MissionVisibility
  groupIds: string[]
  myGroups: Group[]
  onSelectPublic: () => void
  onToggleGroup: (groupId: string) => void
}

export function MissionVisibilityField({
  visibility, groupIds, myGroups, onSelectPublic, onToggleGroup,
}: Props) {
  const filled = visibility === 'PUBLIC' || (visibility === 'GROUP' && groupIds.length > 0)

  return (
    <div className="rounded-2xl border border-warm-200 bg-paper mb-3 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-warm-500">Visible par</span>
        {filled && (
          <span className="w-5 h-5 rounded-full bg-brand flex items-center justify-center">
            <Check className="w-3 h-3 text-ink" strokeWidth={2.5} />
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip active={visibility === 'PUBLIC'} onClick={onSelectPublic}>
          Public
        </Chip>
        {myGroups.map((g) => {
          const isActive = visibility === 'GROUP' && groupIds.includes(g.id)
          return (
            <Chip key={g.id} dot active={isActive} onClick={() => onToggleGroup(g.id)}>
              {g.name}
            </Chip>
          )
        })}
      </div>

      {visibility === 'GROUP' && myGroups.length > 0 && (
        <p className="mt-2 text-[11px] text-warm-500">
          {groupIds.length === 0
            ? 'Sélectionnez au moins un groupe.'
            : `Partagé avec ${groupIds.length} groupe${groupIds.length > 1 ? 's' : ''}.`}
        </p>
      )}

      {myGroups.length === 0 && (
        <p className="mt-2 text-[12px] text-warm-500">
          Rejoignez un groupe pour partager avec vos collègues.
        </p>
      )}
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
