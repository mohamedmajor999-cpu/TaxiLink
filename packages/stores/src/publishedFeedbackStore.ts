import { create } from 'zustand'

// Type union restreint a ce que le formulaire chauffeur peut creer (cf.
// MissionFormType dans missionFormHelpers). Le 3e type BD `TAXILINK` est
// reserve aux courses plateforme/auto-dispatch, jamais publiees via ce flow.
export interface PublishedFeedback {
  type: 'CPAM' | 'PRIVE'
  destination: string
  priceLabel: string
}

interface PublishedFeedbackState {
  feedback: PublishedFeedback | null
  publish: (info: PublishedFeedback) => void
  consume: () => void
}

export const usePublishedFeedbackStore = create<PublishedFeedbackState>((set) => ({
  feedback: null,
  publish: (info) => set({ feedback: info }),
  consume: () => set({ feedback: null }),
}))
