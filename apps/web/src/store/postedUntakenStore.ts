import { create } from 'zustand'
import type { Mission } from '@/lib/supabase/types'

interface PostedUntakenState {
  /** Missions stuck non encore dismissées par l'user. Keyed par id pour dédup. */
  unseen:   Record<string, Mission>
  /** Toast actuellement affiché (la plus récente non dismissée). */
  popup:    Mission | null

  add:          (mission: Mission) => void
  dismissPopup: () => void
  markSeen:     (missionId: string) => void
  reset:        () => void
}

/**
 * Store des missions postées par l'user qui sont stuck (pas prises).
 * Mirror de postedAcceptStore mais pour le cas inverse : signal d'action
 * (modifier / republier / annuler) plutôt que de succès. Stocke la Mission
 * entière pour pouvoir alimenter directement startEdit() sans refetch.
 */
export const usePostedUntakenStore = create<PostedUntakenState>((set, get) => ({
  unseen: {},
  popup:  null,

  add: (mission) => {
    if (get().unseen[mission.id]) return
    set((s) => ({
      unseen: { ...s.unseen, [mission.id]: mission },
      popup:  mission,
    }))
  },

  dismissPopup: () => set({ popup: null }),

  markSeen: (missionId) => set((s) => {
    if (!s.unseen[missionId]) return s
    const { [missionId]: _, ...rest } = s.unseen
    return { unseen: rest }
  }),

  reset: () => set({ unseen: {}, popup: null }),
}))

export function useUnseenUntakenCount(): number {
  return usePostedUntakenStore((s) => Object.keys(s.unseen).length)
}
