import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NightModePref = 'auto' | 'on' | 'off'

interface NightModeState {
  pref: NightModePref
  setPref: (p: NightModePref) => void
  toggle: () => void
}

export const useNightModeStore = create<NightModeState>()(
  persist(
    (set, get) => ({
      pref: 'auto',
      setPref: (pref) => set({ pref }),
      toggle: () => {
        const cur = get().pref
        set({ pref: cur === 'on' ? 'off' : cur === 'off' ? 'auto' : 'on' })
      },
    }),
    { name: 'taxilink-night-mode' },
  ),
)

export function isNightHour(now: Date = new Date()): boolean {
  const h = now.getHours()
  return h >= 20 || h < 8
}

export function nightModeActive(pref: NightModePref, now: Date = new Date()): boolean {
  if (pref === 'on') return true
  if (pref === 'off') return false
  return isNightHour(now)
}
