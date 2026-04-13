import { useState, useRef, useEffect, useCallback } from 'react'
import type { Group } from '@taxilink/core'

export type PendingAction = 'delete' | 'leave' | null

export function useGroupCard(group: Group) {
  const [menuOpen, setMenuOpen]         = useState(false)
  const [copied, setCopied]             = useState(false)
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

  const copyId = useCallback(async () => {
    await navigator.clipboard.writeText(group.id)
    setCopied(true)
    setMenuOpen(false)
    setTimeout(() => setCopied(false), 2000)
  }, [group.id])

  const triggerDelete = () => { setMenuOpen(false); setPendingAction('delete') }
  const triggerLeave  = () => { setMenuOpen(false); setPendingAction('leave')  }
  const cancelAction  = () => setPendingAction(null)

  return {
    menuOpen, setMenuOpen, menuRef,
    copied, copyId,
    pendingAction, triggerDelete, triggerLeave, cancelAction,
  }
}
