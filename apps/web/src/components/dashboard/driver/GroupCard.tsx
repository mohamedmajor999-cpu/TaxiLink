'use client'

import { MoreVertical, Users, Copy, MessageSquare, Share2, LogOut, Trash2, ChevronRight } from 'lucide-react'
import type { Group } from '@taxilink/core'
import type { GroupActivitySummary } from '@/services/groupStatsService'
import { useGroupCard } from './useGroupCard'
import { ConfirmWithPasswordModal } from './ConfirmWithPasswordModal'

interface Props {
  group:     Group
  isAdmin:   boolean
  summary?:  GroupActivitySummary | null
  isActive?: boolean
  onOpen:    (group: Group) => void
  onLeave:   (groupId: string) => void
  onDelete:  (groupId: string) => void
}

export function GroupCard({ group, isAdmin, summary, isActive = false, onOpen, onLeave, onDelete }: Props) {
  const {
    menuOpen, setMenuOpen, menuRef,
    copied, copyId,
    shareViaSms, shareViaWhatsApp,
    pendingAction, triggerDelete, triggerLeave, cancelAction,
  } = useGroupCard(group)

  const members = group.memberCount ?? 0
  const online  = summary?.onlineCount ?? 0

  return (
    <>
      <div
        className={`relative bg-paper rounded-2xl overflow-visible ${
          isActive ? 'border-2 border-ink shadow-card' : 'border border-warm-200'
        }`}
      >
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          {isActive && (
            <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-brand text-ink text-[10px] font-bold uppercase tracking-wider">
              Actif
            </span>
          )}
          <div className="relative" ref={menuRef}>
            {copied && (
              <span className="absolute -top-8 right-0 bg-ink text-brand text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap">
                ID copié !
              </span>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }}
              aria-label="Options du groupe"
              className="w-8 h-8 rounded-full border border-warm-200 bg-paper flex items-center justify-center text-warm-600 hover:bg-warm-50 transition-colors"
            >
              <MoreVertical className="w-4 h-4" strokeWidth={1.8} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 z-50 w-56 bg-paper rounded-2xl shadow-float border border-warm-200 overflow-hidden">
                <MenuItem icon={<Copy className="w-4 h-4" strokeWidth={1.8} />} label="Copier l'ID" onClick={copyId} />
                <MenuItem icon={<MessageSquare className="w-4 h-4" strokeWidth={1.8} />} label="Envoyer par SMS" onClick={shareViaSms} />
                <MenuItem icon={<Share2 className="w-4 h-4" strokeWidth={1.8} />} label="Partager WhatsApp" onClick={shareViaWhatsApp} />
                <div className="border-t border-warm-100" />
                {isAdmin ? (
                  <MenuItem icon={<Trash2 className="w-4 h-4" strokeWidth={1.8} />} label="Supprimer le groupe" onClick={triggerDelete} danger />
                ) : (
                  <MenuItem icon={<LogOut className="w-4 h-4" strokeWidth={1.8} />} label="Quitter le groupe" onClick={triggerLeave} danger />
                )}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpen(group)}
          className="w-full flex items-start gap-3 p-4 text-left pr-20"
          aria-label={`Ouvrir le groupe ${group.name}`}
        >
          <div className="w-12 h-12 rounded-2xl bg-ink flex items-center justify-center flex-shrink-0">
            <span className="text-brand text-[20px] font-bold">
              {group.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-ink truncate">{group.name}</p>
            {group.description && (
              <p className="text-[12.5px] text-warm-500 mt-0.5 truncate">{group.description}</p>
            )}
            <div className="mt-2 flex items-center gap-2 text-[12px] text-warm-600">
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
              <Stat value={`${summary.exchanged7d}`}     label="Échangées (7j)" />
              <Stat value={`${summary.reprisePercent}%`} label="Taux de reprise" />
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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-[20px] font-bold text-ink leading-none tabular-nums">{value}</p>
      <p className="text-[10px] text-warm-500 mt-1 leading-tight">{label}</p>
    </div>
  )
}

function MenuItem({ icon, label, onClick, danger = false }: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors ${
        danger ? 'text-danger hover:bg-danger-soft' : 'text-ink hover:bg-warm-50'
      }`}
    >
      <span className={danger ? 'text-danger' : 'text-warm-600'}>{icon}</span>
      {label}
    </button>
  )
}
