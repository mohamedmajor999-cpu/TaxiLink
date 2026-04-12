import { create } from 'zustand'

export type Screen = 'flux' | 'creer' | 'calendrier' | 'historique' | 'profil'

interface NavState {
  activeScreen: Screen
  setScreen: (screen: Screen) => void
}

export const useNavStore = create<NavState>((set) => ({
  activeScreen: 'flux',
  setScreen: (screen) => set({ activeScreen: screen }),
}))
