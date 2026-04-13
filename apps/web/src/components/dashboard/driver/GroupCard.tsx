'use client'

import { Icon } from '@/components/ui/Icon'
import type { Group } from '@taxilink/core'

interface Props {
  group:       Group
  isAdmin:     boolean
  onViewMembers: (group: Group) => void
  onLeave:     (groupId: string) => void
}

export function GroupCard({ group, isAdmin, onViewMembers, onLeave }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-soft p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-secondary font-black text-lg">
            {group.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-secondary text-sm truncate">{group.name}</p>
            {isAdmin && (
              <span className="flex-shrink-0 text-[10px] font-black uppercase bg-secondary text-primary px-2 py-0.5 rounded-lg">
                Admin
              </span>
            )}
          </div>
          {group.description && (
            <p className="text-xs text-muted truncate mt-0.5">{group.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onViewMembers(group)}
          aria-label="Voir les membres"
          className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-bgsoft text-secondary text-xs font-semibold hover:bg-line transition-colors"
        >
          <Icon name="group" size={14} />
          Membres
        </button>
        {!isAdmin && (
          <button
            onClick={() => onLeave(group.id)}
            aria-label="Quitter le groupe"
            className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
          >
            <Icon name="exit_to_app" size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
