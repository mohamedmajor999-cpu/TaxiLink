import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { sharedStorage } from './_storage'

// 'auto' est conserve dans le type pour ne pas casser la deserialisation des
// valeurs persistees avant l'abandon du switch horaire ; il est traite comme
// 'off' partout (clair, pas de bascule sur l'horloge).
export type NightModePref = 'auto' | 'on' | 'off'

interface NightModeState {
  pref: NightModePref
  setPref: (p: NightModePref) => void
  toggle: () => void
}

export const useNightModeStore = create<NightModeState>()(
  persist(
    (set, get) => ({
      pref: 'off',
      setPref: (pref) => set({ pref }),
      toggle: () => {
        const cur = get().pref
        set({ pref: cur === 'on' ? 'off' : 'on' })
      },
    }),
    {
      name: 'taxilink-night-mode',
      storage: createJSONStorage(() => sharedStorage),
    },
  ),
)

export function nightModeActive(pref: NightModePref): boolean {
  return pref === 'on'
}
