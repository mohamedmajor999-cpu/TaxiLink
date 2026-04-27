'use client'

import { Users, ChevronRight, Pin, PinOff } from 'lucide-react'
import type { Group } from '@taxilink/core'
import type { GroupActivitySummary } from '@/services/groupStatsService'
import { useGroupCard } from './useGroupCard'
import { ConfirmWithPasswordModal } from './ConfirmWithPasswordModal'
import { GroupCardMenu } from './GroupCardMenu'

interface Props {
  group:        Group
  isAdmin:      boolean
  summary?:     GroupActivitySummary | null
  isActive?:    boolean
  onOpen:       (group: Group) => void
  onLeave:      (groupId: string) => void
  onDelete:     (groupId: string) => void
  onTogglePin?: () => void
}

export function GroupCard({ group, isAdmin, summary, isActive = false, onOpen, onLeave, onDelete, onTogglePin }: Props) {
  const {
    menuOpen, setMenuOpen, menuRef,
    copied, copyId,
    shareViaSms, shareViaWhatsApp,
    pendingAction, triggerDelete, triggerLeave, cancelAction,
  } = useGroupCard(group)

  const members = group.memberCount ?? 0
  const online  = summary?.onlineCount ?? 0
  const available = summary?.available ?? 0
  const isAlive = available > 0

  return (
    <>
      <div
        className={`relative bg-paper rounded-2xl overflow-visible ${
          isActive ? 'border-2 border-ink shadow-card' : 'border border-warm-200'
        }`}
      >
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          {onTogglePin && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onTogglePin() }}
              aria-label={isActive ? 'Désépingler ce groupe' : 'Épingler ce groupe'}
              aria-pressed={isActive}
              title={isActive ? 'Désépingler' : 'Épingler comme actif'}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                isActive
                  ? 'bg-brand border-brand text-ink'
                  : 'bg-paper border-warm-200 text-warm-500 hover:bg-warm-50'
              }`}
            >
              {isActive
                ? <Pin className="w-4 h-4" strokeWidth={2} />
                : <PinOff className="w-4 h-4" strokeWidth={1.8} />}
            </button>
          )}
          <GroupCardMenu
            menuRef={menuRef}
            menuOpen={menuOpen}
            toggleMenu={() => setMenuOpen((v) => !v)}
            copied={copied}
            copyId={copyId}
            shareViaSms={shareViaSms}
            shareViaWhatsApp={shareViaWhatsApp}
            isAdmin={isAdmin}
            triggerDelete={triggerDelete}
            triggerLeave={triggerLeave}
          />
        </div>

        <button
          type="button"
          onClick={() => onOpen(group)}
          className="w-full flex items-start gap-3 p-4 text-left pr-20"
          aria-label={`Ouvrir le groupe ${group.name}`}
        >
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-ink flex items-center justify-center">
              <span className="text-brand text-[20px] font-bold">
                {group.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span
              aria-hidden
              title={isAlive ? `${available} course${available > 1 ? 's' : ''} disponible${available > 1 ? 's' : ''}` : 'Aucune course en ce moment'}
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-paper ${
                isAlive ? 'bg-emerald-500 motion-safe:animate-pulse' : 'bg-warm-300'
              }`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-ink truncate">{group.name}</p>
            {group.description && (
              <p className="text-[12.5px] text-warm-500 mt-0.5 truncate">{group.description}</p>
            )}
            <div className="mt-2 flex items-center gap-2 text-[12px] text-warm-600 flex-wrap">
              <Users className="w-3.5 h-3.5 text-warm-500" strokeWidth={1.8} />
              <span>{members} membre{members > 1 ? 's' : ''}</span>
              {online > 0 && (
                <>
                  <span className="text-warm-300">·</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {online} en ligne
                  </span>
                </>
              )}
              {isAlive && (
                <>
                  <span className="text-warm-300">·</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-ink">
                    {available} course{available > 1 ? 's' : ''} dispo
                  </span>
                </>
              )}
            </div>
          </div>
          {!isActive && (
            <ChevronRight className="w-5 h-5 text-warm-400 shrink-0 self-center" strokeWidth={1.8} />
          )}
        </button>

        {isActive && summary && (
          <>
            <div className="h-px bg-warm-100 mx-4" />
            <div className="grid grid-cols-3 px-4 py-3 gap-2">
              <Stat value={`${summary.available}`}       label="Courses dispo" />
              <Stat value={`${summary.exchanged7d}`}     label="Partagées (7j)" />
              <Stat
                value={`${summary.reprisePercent}%`}
                label="Acceptées"
                hint="Part des courses partagées qui ont été acceptées par un membre du groupe."
              />
            </div>
          </>
        )}
      </div>

      {pendingAction === 'delete' && (
        <ConfirmWithPasswordModal
          title="Supprimer le groupe"
          description={`Le groupe "${group.name}" et tous ses membres seront supprimés définitivement. Cette action est irréversible.`}
          confirmLabel="Supprimer"
          onConfirmed={async () => { await onDelete(group.id) }}
          onClose={cancelAction}
        />
      )}

      {pendingAction === 'leave' && (
        <ConfirmWithPasswordModal
          title="Quitter le groupe"
          description={`Tu vas quitter le groupe "${group.name}". Tu devras demander à l'admin de t'y réinviter.`}
          confirmLabel="Quitter"
          onConfirmed={async () => { await onLeave(group.id) }}
          onClose={cancelAction}
        />
      )}
    </>
  )
}

function Stat({ value, label, hint }: { value: string; label: string; hint?: string }) {
  return (
    <div className="text-center" title={hint}>
      <p className="text-[20px] font-bold text-ink leading-none tabular-nums">{value}</p>
      <p className="text-[10px] text-warm-500 mt-1 leading-tight">{label}</p>
    </div>
  )
}
