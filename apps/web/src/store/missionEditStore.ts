import { create } from 'zustand'
import type { Mission } from '@/lib/supabase/types'

/**
 * Store minimal pour signaler une demande d'édition d'une mission postée.
 * Le DriverDashboard observe `editing` et ouvre PartagerMissionModal en mode update.
 */
interface MissionEditState {
  editing: Mission | null
  startEdit: (mission: Mission) => void
  clearEdit: () => void
}

export const useMissionEditStore = create<MissionEditState>((set) => ({
  editing: null,
  startEdit: (mission) => set({ editing: mission }),
  clearEdit: () => set({ editing: null }),
}))
