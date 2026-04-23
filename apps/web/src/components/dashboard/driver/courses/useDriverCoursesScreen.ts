'use client'
import { useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { usePostedAcceptStore, useUnseenAcceptCount } from '@/store/postedAcceptStore'

export type CoursesTab = 'upcoming' | 'agenda' | 'posted' | 'history'
const VALID_SUBTABS: CoursesTab[] = ['upcoming', 'agenda', 'posted', 'history']

export function useDriverCoursesScreen() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const subParam = searchParams.get('subtab')
  const active: CoursesTab = subParam && (VALID_SUBTABS as string[]).includes(subParam) ? (subParam as CoursesTab) : 'upcoming'

  const unseenAccepts = useUnseenAcceptCount()
  const clearUnseen = usePostedAcceptStore((s) => s.clearUnseen)

  const setActive = (tab: CoursesTab) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'upcoming') params.delete('subtab')
    else params.set('subtab', tab)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
    if (tab === 'posted') clearUnseen()
  }

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
