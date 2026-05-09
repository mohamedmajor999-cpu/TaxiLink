import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface AcceptedMissionInfo {
  missionId: string
  departure: string
  destination: string
  acceptedAt: string
  driverName: string
  driverPhone: string | null
}

interface PostedAcceptState {
  unseen: Record<string, AcceptedMissionInfo>
  popup: AcceptedMissionInfo | null
  /** Missions deja vues / clearees par l'user : empeche les UPDATE realtime
   *  successifs (status enroute/arrived/...) de re-notifier la meme mission
   *  apres un refresh ou une re-ouverture du navigateur. Persiste en
   *  localStorage. */
  dismissed: Record<string, true>
  add: (info: AcceptedMissionInfo) => void
  dismissPopup: () => void
  markSeen: (missionId: string) => void
  clearUnseen: () => void
  reset: () => void
}

export const usePostedAcceptStore = create<PostedAcceptState>()(
  persist(
    (set, get) => ({
      unseen:    {},
      popup:     null,
      dismissed: {},

      add: (info) => {
        const s = get()
        if (s.unseen[info.missionId] || s.dismissed[info.missionId]) return
        set({
          unseen: { ...s.unseen, [info.missionId]: info },
          popup:  info,
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
      name: 'taxilink-posted-accept',
      storage: createJSONStorage(() => localStorage),
      // localStorage : `dismissed` survit aussi a la fermeture du navigateur.
      // UUID de missions => pas de collision, croissance lineaire en O(N).
      partialize: (s) => ({ dismissed: s.dismissed }),
    },
  ),
)

export function useUnseenAcceptCount(): number {
  return usePostedAcceptStore((s) => Object.keys(s.unseen).length)
}

export function useIsMissionUnseen(missionId: string): boolean {
  return usePostedAcceptStore((s) => Boolean(s.unseen[missionId]))
}
