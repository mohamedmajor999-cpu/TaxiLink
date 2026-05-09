import { create } from 'zustand'
import type { Mission } from '@/lib/supabase/types'
import { missionService } from '@/services/missionService'

interface DriverAgendaState {
  missions: Mission[]
  isLoading: boolean
  loadedFor: string | null
  error: string | null
  load: (driverId: string, opts?: { force?: boolean }) => Promise<void>
  reset: () => void
  addMission: (mission: Mission) => void
  removeMission: (id: string) => void
  updateMission: (mission: Mission) => void
  upsertById: (id: string) => Promise<void>
}

export const useDriverAgendaStore = create<DriverAgendaState>((set, get) => ({
  missions: [],
  isLoading: false,
  loadedFor: null,
  error: null,

  load: async (driverId, opts) => {
    const state = get()
    if (!opts?.force && state.loadedFor === driverId && !state.error) return
    set({ isLoading: true, error: null })
    try {
      const list = await missionService.getAgenda(driverId)
      set({ missions: list, loadedFor: driverId, isLoading: false })
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'Erreur',
        isLoading: false,
      })
    }
  },

  reset: () => set({ missions: [], loadedFor: null, error: null }),

  addMission: (mission) =>
    set((s) => (s.missions.some((m) => m.id === mission.id)
      ? s
      : { missions: [...s.missions, mission] })),

  removeMission: (id) =>
    set((s) => ({ missions: s.missions.filter((m) => m.id !== id) })),

  updateMission: (mission) =>
    set((s) => ({
      missions: s.missions.map((m) => (m.id === mission.id ? mission : m)),
    })),

  upsertById: async (id) => {
    const full = await missionService.getById(id)
    if (!full) return
    set((s) => ({
      missions: s.missions.some((m) => m.id === full.id)
        ? s.missions.map((m) => (m.id === full.id ? full : m))
        : [...s.missions, full],
    }))
  },
}))
