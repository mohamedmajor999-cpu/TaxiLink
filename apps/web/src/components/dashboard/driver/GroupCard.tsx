'use client'

import { Icon } from '@/components/ui/Icon'
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
      <div className="bg-white rounded-2xl shadow-soft p-4 flex items-center justify-between gap-3">
        <button
          onClick={() => onViewMembers(group)}
          className="flex items-center gap-3 min-w-0 flex-1 text-left hover:opacity-75 transition-opacity"
          aria-label={`Voir les membres de ${group.name}`}
        >
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
            <div className="flex items-center gap-2 mt-0.5">
              {group.description && (
                <p className="text-xs text-muted truncate">{group.description}</p>
              )}
              {group.memberCount !== undefined && (
                <span className="flex-shrink-0 flex items-center gap-1 text-xs text-muted">
                  {group.description && <span className="text-line">·</span>}
                  <Icon name="group" size={12} className="text-muted" />
                  {group.memberCount}
                </span>
              )}
            </div>
          </div>
        </button>

        <div className="relative flex-shrink-0" ref={menuRef}>
          {copied && (
            <span className="absolute -top-8 right-0 bg-secondary text-primary text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap">
              ID copié !
            </span>
          )}

          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Options du groupe"
            className="w-9 h-9 rounded-xl bg-bgsoft flex items-center justify-center hover:bg-line transition-colors"
          >
            <Icon name="more_vert" size={18} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-11 z-50 w-56 bg-white rounded-2xl shadow-lg border border-line overflow-hidden">
              <button
                onClick={() => { onViewMembers(group); setMenuOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-secondary hover:bg-bgsoft transition-colors"
              >
                <Icon name="group" size={16} className="text-muted" />
                Voir les membres
              </button>

              <div className="border-t border-line mx-4" />
              <p className="px-4 pt-2 pb-1 text-[10px] font-black uppercase text-muted tracking-wider">
                Inviter un collègue
              </p>

              <button
                onClick={copyId}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-secondary hover:bg-bgsoft transition-colors"
              >
                <Icon name="content_copy" size={16} className="text-muted" />
                Copier l&apos;ID
              </button>

              <button
                onClick={shareViaSms}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-secondary hover:bg-bgsoft transition-colors"
              >
                <Icon name="sms" size={16} className="text-muted" />
                Envoyer par SMS
              </button>

              <button
                onClick={shareViaWhatsApp}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-secondary hover:bg-bgsoft transition-colors"
              >
                <Icon name="share" size={16} className="text-muted" />
                Partager WhatsApp
              </button>

              <div className="border-t border-line" />

              {isAdmin ? (
                <button
                  onClick={triggerDelete}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Icon name="delete" size={16} />
                  Supprimer le groupe
                </button>
              ) : (
                <button
                  onClick={triggerLeave}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Icon name="exit_to_app" size={16} />
                  Quitter le groupe
                </button>
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
