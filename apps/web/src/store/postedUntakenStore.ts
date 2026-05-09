import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Mission } from '@/lib/supabase/types'

interface PostedUntakenState {
  /** Missions stuck non encore dismissées par l'user. Keyed par id pour dédup. */
  unseen:    Record<string, Mission>
  /** Toast actuellement affiché (la plus récente non dismissée). */
  popup:     Mission | null
  /** Missions deja vues / clearees par l'user : empeche le poll de les re-injecter
   *  via add() au prochain tick. Persiste pour la duree de la session uniquement. */
  dismissed: Record<string, true>

  add:          (mission: Mission) => void
  dismissPopup: () => void
  markSeen:     (missionId: string) => void
  clearUnseen:  () => void
  reset:        () => void
}

/**
 * Store des missions postées par l'user qui sont stuck (pas prises).
 * Mirror de postedAcceptStore mais pour le cas inverse : signal d'action
 * (modifier / republier / annuler) plutôt que de succès. Stocke la Mission
 * entière pour pouvoir alimenter directement startEdit() sans refetch.
 */
export const usePostedUntakenStore = create<PostedUntakenState>()(
  persist(
    (set, get) => ({
      unseen:    {},
      popup:     null,
      dismissed: {},

      add: (mission) => {
        const s = get()
        if (s.unseen[mission.id] || s.dismissed[mission.id]) return
        set({
          unseen: { ...s.unseen, [mission.id]: mission },
          popup:  mission,
        })
      },

      dismissPopup: () => set({ popup: null }),

      markSeen: (missionId) => set((s) => {
        if (!s.unseen[missionId]) return s
        const { [missionId]: _, ...rest } = s.unseen
        return {
          unseen:    rest,
          dismissed: { ...s.dismissed, [missionId]: true as const },
        }
      }),

      clearUnseen: () => set((s) => ({
        unseen:    {},
        dismissed: { ...s.dismissed, ...Object.fromEntries(Object.keys(s.unseen).map((id) => [id, true as const])) },
      })),

      reset: () => set({ unseen: {}, popup: null, dismissed: {} }),
    }),
    {
      name: 'taxilink-posted-untaken',
      storage: createJSONStorage(() => sessionStorage),
      // Seul `dismissed` est persiste : il survit au refresh F5 mais pas a la
      // fermeture de l'onglet. unseen et popup repartent vides au remount.
      partialize: (s) => ({ dismissed: s.dismissed }),
    },
  ),
)

export function useUnseenUntakenCount(): number {
  return usePostedUntakenStore((s) => Object.keys(s.unseen).length)
}

export function useIsMissionUnseenUntaken(missionId: string): boolean {
  return usePostedUntakenStore((s) => Boolean(s.unseen[missionId]))
}
