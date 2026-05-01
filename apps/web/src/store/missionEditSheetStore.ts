import { create } from 'zustand'
import type { Mission } from '@/lib/supabase/types'

export type EditMode = 'corrections' | 'price'

interface State {
  mission: Mission | null
  mode: EditMode | null
}

interface Actions {
  open: (mission: Mission, mode?: EditMode) => void
  close: () => void
}

// Détermine le mode par défaut selon le statut :
//   - DONE → 'price' (focus sur le prix réel)
//   - sinon → 'corrections' (focus sur l'adresse)
function inferMode(mission: Mission): EditMode {
  return mission.status === 'DONE' ? 'price' : 'corrections'
}

export const useMissionEditSheetStore = create<State & Actions>((set) => ({
  mission: null,
  mode: null,
  open: (mission, mode) => set({ mission, mode: mode ?? inferMode(mission) }),
  close: () => set({ mission: null, mode: null }),
}))
