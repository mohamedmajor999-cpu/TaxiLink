import { create } from 'zustand'

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
  add: (info: AcceptedMissionInfo) => void
  dismissPopup: () => void
  clearUnseen: () => void
  reset: () => void
}

export const usePostedAcceptStore = create<PostedAcceptState>((set, get) => ({
  unseen: {},
  popup: null,

  add: (info) => {
    if (get().unseen[info.missionId]) return
    set((s) => ({
      unseen: { ...s.unseen, [info.missionId]: info },
      popup: info,
    }))
  },

  dismissPopup: () => set({ popup: null }),

  clearUnseen: () => set({ unseen: {} }),

  reset: () => set({ unseen: {}, popup: null }),
}))

export function useUnseenAcceptCount(): number {
  return usePostedAcceptStore((s) => Object.keys(s.unseen).length)
}
