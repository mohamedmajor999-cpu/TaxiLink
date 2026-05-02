'use client'
import { useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useUnseenAcceptCount } from '@/store/postedAcceptStore'

export type CoursesTab = 'today' | 'agenda' | 'ads' | 'stats'
const VALID_SUBTABS: CoursesTab[] = ['today', 'agenda', 'ads', 'stats']

// Rétro-compat URL : anciens noms → nouveaux. `history` ramene desormais sur
// l'onglet Stats integre (anciennement page hamburger DriverStatsScreen).
const LEGACY_MAP: Record<string, CoursesTab> = {
  upcoming: 'today',
  posted: 'ads',
  history: 'stats',
}

export function useDriverCoursesScreen() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const subParam = searchParams.get('subtab')

  const active: CoursesTab = (() => {
    if (!subParam) return 'today'
    if ((VALID_SUBTABS as string[]).includes(subParam)) return subParam as CoursesTab
    if (subParam in LEGACY_MAP) return LEGACY_MAP[subParam]
    return 'today'
  })()

  const unseenAccepts = useUnseenAcceptCount()

  const setActive = (tab: CoursesTab) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'today') params.delete('subtab')
    else params.set('subtab', tab)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  // Si l'utilisateur arrive avec un nom legacy dans l'URL, on normalise en arrière-plan.
  useEffect(() => {
    if (subParam && !VALID_SUBTABS.includes(subParam as CoursesTab) && subParam in LEGACY_MAP) {
      const params = new URLSearchParams(searchParams.toString())
      const next = LEGACY_MAP[subParam]
      if (next === 'today') params.delete('subtab')
      else params.set('subtab', next)
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname)
    }
  }, [subParam, searchParams, router, pathname])

  const today = new Date()
  const dateLabel = today.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const subTabs: { id: CoursesTab; label: string; icon?: string; badge?: number }[] = [
    { id: 'today', label: "Aujourd'hui" },
    { id: 'agenda', label: 'Agenda' },
    { id: 'ads', label: 'Annonces', badge: unseenAccepts },
    { id: 'stats', label: 'Stats' },
  ]

  return { active, setActive, subTabs, dateLabel, postedBadge: unseenAccepts }
}
