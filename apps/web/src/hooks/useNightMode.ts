import { useEffect, useState } from 'react'
import { nightModeActive, useNightModeStore, type NightModePref } from '@/store/nightModeStore'

export function useNightMode(): { active: boolean; pref: NightModePref; toggle: () => void } {
  const pref = useNightModeStore((s) => s.pref)
  const toggle = useNightModeStore((s) => s.toggle)
  const [active, setActive] = useState(() => nightModeActive(pref))

  useEffect(() => {
    setActive(nightModeActive(pref))
    if (pref !== 'auto') return
    const id = setInterval(() => setActive(nightModeActive(pref)), 60_000)
    return () => clearInterval(id)
  }, [pref])

  useEffect(() => {
    const root = document.documentElement
    if (active) root.classList.add('dark')
    else root.classList.remove('dark')
  }, [active])

  return { active, pref, toggle }
}
