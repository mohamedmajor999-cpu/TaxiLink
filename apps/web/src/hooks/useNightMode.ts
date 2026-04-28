import { useEffect } from 'react'
import { nightModeActive, useNightModeStore, type NightModePref } from '@/store/nightModeStore'

export function useNightMode(): { active: boolean; pref: NightModePref; toggle: () => void } {
  const pref = useNightModeStore((s) => s.pref)
  const toggle = useNightModeStore((s) => s.toggle)
  const active = nightModeActive(pref)

  useEffect(() => {
    const root = document.documentElement
    if (active) root.classList.add('dark')
    else root.classList.remove('dark')
  }, [active])

  return { active, pref, toggle }
}
