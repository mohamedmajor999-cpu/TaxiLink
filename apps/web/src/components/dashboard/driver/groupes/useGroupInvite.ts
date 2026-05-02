import { useCallback, useState } from 'react'
import type { Group } from '@taxilink/core'
import { useDriverStore } from '@/store/driverStore'
import { buildGroupInviteText } from '@/lib/groupInvite'

export function useGroupInvite(group: Group | null) {
  const driverName = useDriverStore((s) => s.driver.name)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const buildText = useCallback(() => {
    if (!group) return ''
    return buildGroupInviteText({
      groupId: group.id, groupName: group.name, inviterName: driverName,
    })
  }, [group, driverName])

  const buildLink = useCallback(() => {
    if (!group) return ''
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://taxilink.fr'
    return `${origin}/rejoindre/${group.id}`
  }, [group])

  const shareViaSms = useCallback(() => {
    window.open(`sms:?body=${encodeURIComponent(buildText())}`, '_self')
    setOpen(false)
  }, [buildText])

  const shareViaWhatsApp = useCallback(() => {
    window.open(`https://wa.me/?text=${encodeURIComponent(buildText())}`, '_blank')
    setOpen(false)
  }, [buildText])

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildLink())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard refusé : silencieux, l'utilisateur réessaiera */ }
    setOpen(false)
  }, [buildLink])

  return { open, setOpen, copied, shareViaSms, shareViaWhatsApp, copyLink }
}
