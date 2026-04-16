import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useOnboardingPage } from '@/components/onboarding/useOnboardingPage'

// ─── Mock IntersectionObserver ────────────────────────────────────────────────
const mockObserve    = vi.fn()
const mockDisconnect = vi.fn()

const MockIntersectionObserver = vi.fn(() => ({
  observe: mockObserve,
  disconnect: mockDisconnect,
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ─── État initial ─────────────────────────────────────────────────────────────
describe('useOnboardingPage — état initial', () => {
  it('showCta est false au départ', () => {
    const { result } = renderHook(() => useOnboardingPage())
    expect(result.current.showCta).toBe(false)
  })

  it('expose une ref lastSectionRef initialement null', () => {
    const { result } = renderHook(() => useOnboardingPage())
    expect(result.current.lastSectionRef).toBeDefined()
    expect(result.current.lastSectionRef.current).toBeNull()
  })
})

// ─── Comportement IntersectionObserver ───────────────────────────────────────
// Note: l'observer n'est créé que si lastSectionRef.current est non-null au montage.
// En environnement de test, la ref est null → l'effect retourne tôt.
// On vérifie donc que le hook ne crashe pas et que l'observer n'est pas appelé à tort.
describe('useOnboardingPage — IntersectionObserver', () => {
  it('ne crée pas d\'observer si la ref est null au montage', () => {
    renderHook(() => useOnboardingPage())
    expect(MockIntersectionObserver).not.toHaveBeenCalled()
    expect(mockObserve).not.toHaveBeenCalled()
  })

  it('n\'appelle pas disconnect si aucun observer n\'a été créé', () => {
    const { unmount } = renderHook(() => useOnboardingPage())
    unmount()
    expect(mockDisconnect).not.toHaveBeenCalled()
  })
})
