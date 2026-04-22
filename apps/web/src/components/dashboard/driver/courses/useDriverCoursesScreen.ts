'use client'
import { useEffect, useState } from 'react'
import { usePostedAcceptStore, useUnseenAcceptCount } from '@/store/postedAcceptStore'

export type CoursesTab = 'upcoming' | 'agenda' | 'posted' | 'history'

export function useDriverCoursesScreen() {
  const [active, setActiveRaw] = useState<CoursesTab>('upcoming')
  const unseenAccepts = useUnseenAcceptCount()
  const clearUnseen = usePostedAcceptStore((s) => s.clearUnseen)

  const setActive = (tab: CoursesTab) => {
    setActiveRaw(tab)
    if (tab === 'posted') clearUnseen()
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => setActive('posted')
    window.addEventListener('taxilink:open-posted-tab', handler)
    return () => window.removeEventListener('taxilink:open-posted-tab', handler)
  }, [])

  useEffect(() => {
    if (active === 'posted' && unseenAccepts > 0) clearUnseen()
  }, [active, unseenAccepts, clearUnseen])

  const today = new Date()
  const dateLabel = today.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const subTabs: { id: CoursesTab; label: string; icon?: string; badge?: number }[] = [
    { id: 'upcoming', label: 'À venir' },
    { id: 'posted', label: 'Postées', badge: unseenAccepts },
    { id: 'agenda', label: 'Agenda', icon: '📅' },
    { id: 'history', label: 'Historique' },
  ]

  return { active, setActive, subTabs, dateLabel, postedBadge: unseenAccepts }
}
