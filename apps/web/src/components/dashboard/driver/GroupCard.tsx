'use client'

import { MoreVertical, Users, Copy, MessageSquare, Share2, LogOut, Trash2 } from 'lucide-react'
import type { Group } from '@taxilink/core'
import { useGroupCard } from './useGroupCard'
import { ConfirmWithPasswordModal } from './ConfirmWithPasswordModal'

interface Props {
  group:         Group
  isAdmin:       boolean
  onViewMembers: (group: Group) => void
  onLeave:       (groupId: string) => void
  onDelete:      (groupId: string) => void
}

export function GroupCard({ group, isAdmin, onViewMembers, onLeave, onDelete }: Props) {
  const {
    menuOpen, setMenuOpen, menuRef,
    copied, copyId,
    shareViaSms, shareViaWhatsApp,
    pendingAction, triggerDelete, triggerLeave, cancelAction,
  } = useGroupCard(group)

  return (
    <>
      <div className="relative bg-paper border border-warm-200 rounded-2xl p-4 flex items-start gap-3">
        <button
          type="button"
          onClick={() => onViewMembers(group)}
          className="flex items-start gap-3 min-w-0 flex-1 text-left"
          aria-label={`Voir les membres de ${group.name}`}
        >
          <div className="w-12 h-12 rounded-2xl bg-ink flex items-center justify-center flex-shrink-0">
            <span className="text-brand text-[20px] font-bold">
              {group.name.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-bold text-ink truncate">{group.name}</p>
              {isAdmin && (
                <span className="shrink-0 inline-flex items-center h-[18px] px-2 rounded-full bg-brand text-ink text-[10px] font-bold uppercase tracking-wider">
                  Actif
                </span>
              )}
            </div>
            {group.description && (
              <p className="text-[12.5px] text-warm-500 mt-0.5 truncate">
                {group.description}
              </p>
            )}
            {group.memberCount !== undefined && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] text-warm-600">
                <Users className="w-3.5 h-3.5 text-warm-500" strokeWidth={1.8} />
                {group.memberCount} membre{group.memberCount > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </button>

        <div className="relative shrink-0" ref={menuRef}>
          {copied && (
            <span className="absolute -top-8 right-0 bg-ink text-brand text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap">
              ID copié !
            </span>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Options du groupe"
            className="w-9 h-9 rounded-full border border-warm-200 bg-paper flex items-center justify-center text-warm-600 hover:bg-warm-50 transition-colors"
          >
            <MoreVertical className="w-4 h-4" strokeWidth={1.8} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-11 z-50 w-56 bg-paper rounded-2xl shadow-float border border-warm-200 overflow-hidden">
              <MenuItem
                icon={<Users className="w-4 h-4" strokeWidth={1.8} />}
                label="Voir les membres"
                onClick={() => { onViewMembers(group); setMenuOpen(false) }}
              />
              <div className="border-t border-warm-100" />
              <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase text-warm-500 tracking-[0.14em]">
                Inviter un collègue
              </p>
              <MenuItem
                icon={<Copy className="w-4 h-4" strokeWidth={1.8} />}
                label="Copier l'ID"
                onClick={copyId}
              />
              <MenuItem
                icon={<MessageSquare className="w-4 h-4" strokeWidth={1.8} />}
                label="Envoyer par SMS"
                onClick={shareViaSms}
              />
              <MenuItem
                icon={<Share2 className="w-4 h-4" strokeWidth={1.8} />}
                label="Partager WhatsApp"
                onClick={shareViaWhatsApp}
              />
              <div className="border-t border-warm-100" />
              {isAdmin ? (
                <MenuItem
                  icon={<Trash2 className="w-4 h-4" strokeWidth={1.8} />}
                  label="Supprimer le groupe"
                  onClick={triggerDelete}
                  danger
                />
              ) : (
                <MenuItem
                  icon={<LogOut className="w-4 h-4" strokeWidth={1.8} />}
                  label="Quitter le groupe"
                  onClick={triggerLeave}
                  danger
                />
              )}
            </div>
          )}
        </div>
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

function MenuItem({
  icon, label, onClick, danger = false,
}: {
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
        danger
          ? 'text-danger hover:bg-danger-soft'
          : 'text-ink hover:bg-warm-50'
      }`}
    >
      <span className={danger ? 'text-danger' : 'text-warm-600'}>{icon}</span>
      {label}
    </button>
  )
}
