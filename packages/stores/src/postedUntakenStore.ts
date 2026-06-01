import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Mission } from '@taxilink/supabase-types'
import { sharedStorage } from './_storage'

interface PostedUntakenState {
  /** Missions stuck non encore dismissees par l'user. Keyed par id pour dedup. */
  unseen: Record<string, Mission>
  /** Toast actuellement affiche (la plus recente non dismissee). */
  popup: Mission | null
  /** Missions deja vues / clearees par l'user : empeche le poll de les re-injecter
   *  via add() au prochain tick. Persiste en localStorage (survit refresh et
   *  re-ouverture du navigateur). */
  dismissed: Record<string, true>

  add: (mission: Mission) => void
  dismissPopup: () => void
  markSeen: (missionId: string) => void
  clearUnseen: () => void
  reset: () => void
}

/**
 * Store des missions postees par l'user qui sont stuck (pas prises).
 * Mirror de postedAcceptStore mais pour le cas inverse : signal d'action
 * (modifier / republier / annuler) plutot que de succes. Stocke la Mission
 * entiere pour pouvoir alimenter directement startEdit() sans refetch.
 */
export const usePostedUntakenStore = create<PostedUntakenState>()(
  persist(
    (set, get) => ({
      unseen: {},
      popup: null,
      dismissed: {},

      add: (mission) => {
        const s = get()
        if (s.unseen[mission.id] || s.dismissed[mission.id]) return
        set({
          unseen: { ...s.unseen, [mission.id]: mission },
          popup: mission,
        })
      },

      dismissPopup: () => set({ popup: null }),

      markSeen: (missionId) =>
        set((s) => {
          if (!s.unseen[missionId]) return s
          const { [missionId]: _, ...rest } = s.unseen
          return {
            unseen: rest,
            dismissed: { ...s.dismissed, [missionId]: true as const },
          }
        }),

      clearUnseen: () =>
        set((s) => ({
          unseen: {},
          dismissed: {
            ...s.dismissed,
            ...Object.fromEntries(Object.keys(s.unseen).map((id) => [id, true as const])),
          },
        })),

      reset: () => set({ unseen: {}, popup: null, dismissed: {} }),
    }),
    {
      name: 'taxilink-posted-untaken',
      storage: createJSONStorage(() => sharedStorage),
      // `sharedStorage` = localStorage (web) ou AsyncStorage (mobile inject au boot).
      // Seul `dismissed` est persiste : survit au refresh ET a la fermeture de l'app.
      // Les UUID de missions ne se reutilisent pas, donc le store ne croit que d'1
      // entree par mission posteee dismiss.
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
