'use client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export type Tab = 'reserver' | 'mes-courses'
const VALID_TABS: Tab[] = ['reserver', 'mes-courses']

export function useClientDashboard() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab: Tab = tabParam && (VALID_TABS as string[]).includes(tabParam) ? (tabParam as Tab) : 'reserver'

  const setTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams.toString())
    if (next === 'reserver') params.delete('tab')
    else params.set('tab', next)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return { tab, setTab }
}
