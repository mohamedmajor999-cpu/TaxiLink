'use client'
import { useEffect, useRef } from 'react'
import { Copy, MessageSquare, Share2, Check } from 'lucide-react'

interface Props {
  open:             boolean
  onClose:          () => void
  copied:           boolean
  copyLink:         () => void
  shareViaSms:      () => void
  shareViaWhatsApp: () => void
}

// Petit dropdown reutilise par le top bar (icone person_add) et le bouton
// "Inviter un confrere" du detail de groupe. On garde le markup minimal :
// 3 actions, libelles courts, fermeture au clic exterieur.
export function GroupInviteSheet(p: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!p.open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) p.onClose()
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [p])
  if (!p.open) return null
  return (
    <div
      ref={ref}
      className="absolute right-0 top-12 z-50 w-60 bg-paper rounded-2xl shadow-float border border-warm-200 overflow-hidden"
    >
      <header className="px-4 pt-3 pb-2 border-b border-warm-100">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-warm-500">
          Inviter un confrère
        </p>
      </header>
      <Item
        icon={<MessageSquare className="w-4 h-4" strokeWidth={1.8} />}
        label="Envoyer par SMS"
        onClick={p.shareViaSms}
      />
      <Item
        icon={<Share2 className="w-4 h-4" strokeWidth={1.8} />}
        label="Partager sur WhatsApp"
        onClick={p.shareViaWhatsApp}
      />
      <Item
        icon={p.copied ? <Check className="w-4 h-4" strokeWidth={2} /> : <Copy className="w-4 h-4" strokeWidth={1.8} />}
        label={p.copied ? 'Lien copié !' : 'Copier le lien'}
        onClick={p.copyLink}
      />
    </div>
  )
}

function Item({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-ink hover:bg-warm-50 transition-colors"
    >
      <span className="text-warm-600">{icon}</span>
      {label}
    </button>
  )
}
