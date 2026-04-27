'use client'
import type { RefObject } from 'react'
import { MoreVertical, Copy, MessageSquare, Share2, LogOut, Trash2 } from 'lucide-react'

interface Props {
  menuRef:        RefObject<HTMLDivElement>
  menuOpen:       boolean
  toggleMenu:     () => void
  copied:         boolean
  copyId:         () => void
  shareViaSms:    () => void
  shareViaWhatsApp: () => void
  isAdmin:        boolean
  triggerDelete:  () => void
  triggerLeave:   () => void
}

export function GroupCardMenu(p: Props) {
  return (
    <div className="relative" ref={p.menuRef}>
      {p.copied && (
        <span className="absolute -top-8 right-0 bg-ink text-brand text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap">
          ID copié !
        </span>
      )}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); p.toggleMenu() }}
        aria-label="Options du groupe"
        className="w-8 h-8 rounded-full border border-warm-200 bg-paper flex items-center justify-center text-warm-600 hover:bg-warm-50 transition-colors"
      >
        <MoreVertical className="w-4 h-4" strokeWidth={1.8} />
      </button>
      {p.menuOpen && (
        <div className="absolute right-0 top-10 z-50 w-56 bg-paper rounded-2xl shadow-float border border-warm-200 overflow-hidden">
          <Item icon={<Copy className="w-4 h-4" strokeWidth={1.8} />} label="Copier l'ID" onClick={p.copyId} />
          <Item icon={<MessageSquare className="w-4 h-4" strokeWidth={1.8} />} label="Envoyer par SMS" onClick={p.shareViaSms} />
          <Item icon={<Share2 className="w-4 h-4" strokeWidth={1.8} />} label="Partager WhatsApp" onClick={p.shareViaWhatsApp} />
          <div className="border-t border-warm-100" />
          {p.isAdmin
            ? <Item icon={<Trash2 className="w-4 h-4" strokeWidth={1.8} />} label="Supprimer le groupe" onClick={p.triggerDelete} danger />
            : <Item icon={<LogOut className="w-4 h-4" strokeWidth={1.8} />} label="Quitter le groupe" onClick={p.triggerLeave} danger />}
        </div>
      )}
    </div>
  )
}

function Item({ icon, label, onClick, danger = false }: {
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
