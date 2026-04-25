import { create } from 'zustand'

export interface PublishedFeedback {
  type: 'CPAM' | 'PRIVE' | 'PRESCRIPTION'
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
