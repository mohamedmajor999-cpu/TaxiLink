import { useState, useRef, useEffect, useCallback } from 'react'
import type { Group } from '@taxilink/core'

export type PendingAction = 'delete' | 'leave' | null

export function useGroupCard(group: Group) {
  const [menuOpen, setMenuOpen]           = useState(false)
  const [copied, setCopied]               = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  const inviteText = `Rejoins mon groupe "${group.name}" sur TaxiLink Pro 🚖\nOuvre l'app → Groupes → Rejoindre → colle cet ID :\n${group.id}`

  const copyId = useCallback(async () => {
    await navigator.clipboard.writeText(group.id)
    setCopied(true)
    setMenuOpen(false)
    setTimeout(() => setCopied(false), 2000)
  }, [group.id])

  const shareViaSms = useCallback(() => {
    window.open(`sms:?body=${encodeURIComponent(inviteText)}`, '_self')
    setMenuOpen(false)
  }, [inviteText])

  const shareViaWhatsApp = useCallback(() => {
    window.open(`https://wa.me/?text=${encodeURIComponent(inviteText)}`, '_blank')
    setMenuOpen(false)
  }, [inviteText])

  const triggerDelete = () => { setMenuOpen(false); setPendingAction('delete') }
  const triggerLeave  = () => { setMenuOpen(false); setPendingAction('leave')  }
  const cancelAction  = () => setPendingAction(null)

  return {
    menuOpen, setMenuOpen, menuRef,
    copied, copyId,
    shareViaSms, shareViaWhatsApp,
    pendingAction, triggerDelete, triggerLeave, cancelAction,
  }
}
