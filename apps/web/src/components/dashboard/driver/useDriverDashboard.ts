'use client'
import { useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { DriverTab } from '@/components/taxilink/navTypes'

export type Tab = DriverTab
const VALID_TABS: Tab[] = ['home', 'courses', 'groupes', 'profil']

// Rétro-compat URL : ?tab=stats redirige vers Mes courses → onglet Stats.
const LEGACY_TAB_REDIRECT: Record<string, { tab: Tab; subtab?: string }> = {
  stats: { tab: 'courses', subtab: 'stats' },
}

export function useDriverDashboard() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const tabParam = searchParams.get('tab')
  const activeTab: Tab = tabParam && (VALID_TABS as string[]).includes(tabParam) ? (tabParam as Tab) : 'home'

  // Migre silencieusement ?tab=stats (ancien) → ?tab=courses&subtab=stats.
  useEffect(() => {
    if (!tabParam) return
    const redirect = LEGACY_TAB_REDIRECT[tabParam]
    if (!redirect) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', redirect.tab)
    if (redirect.subtab) params.set('subtab', redirect.subtab)
    router.replace(`${pathname}?${params.toString()}`)
  }, [tabParam, searchParams, router, pathname])
  const detailMissionId = searchParams.get('mission')
  const showCreer = searchParams.get('creer') === '1'
  const profilSub = searchParams.get('profilSub')

  const pushParams = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') params.delete(k)
      else params.set(k, v)
    }
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const setActiveTab = (tab: Tab) => pushParams({ tab: tab === 'home' ? null : tab, mission: null, creer: null, profilSub: null })
  const setDetailMissionId = (id: string | null) => pushParams({ mission: id })
  const setShowCreer = (open: boolean) => pushParams({ creer: open ? '1' : null })
  const setProfilSub = (sub: string | null) => pushParams({ profilSub: sub })

  return {
    activeTab, setActiveTab,
    showCreer, setShowCreer,
    detailMissionId, setDetailMissionId,
    profilSub, setProfilSub,
  }
}
