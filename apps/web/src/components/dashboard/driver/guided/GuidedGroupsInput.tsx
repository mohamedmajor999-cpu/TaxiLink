'use client'

import type { Group } from '@taxilink/core'
import { Chip } from '../MissionFormPrimitives'

interface Props {
  myGroups: Group[]
  value: unknown
  onChange: (value: string[]) => void
}

export function GuidedGroupsInput({ myGroups, value, onChange }: Props) {
  const current = Array.isArray(value) ? (value as string[]) : []
  const toggle = (id: string) => {
    onChange(current.includes(id) ? current.filter((x) => x !== id) : [...current, id])
  }
  if (myGroups.length === 0) {
    return <p className="text-[13px] text-warm-500">Vous n&apos;avez aucun groupe. Sélectionnez « Publique » à l&apos;étape précédente.</p>
  }
  return (
    <div className="flex flex-wrap gap-2">
      {myGroups.map((g) => (
        <Chip key={g.id} dot active={current.includes(g.id)} onClick={() => toggle(g.id)}>
          {g.name}
        </Chip>
      ))}
    </div>
  )
}
