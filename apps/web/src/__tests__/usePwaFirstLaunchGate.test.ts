import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const mockRouterReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
}))

const mockHasSeenOnboarding = vi.fn()

vi.mock('@/components/onboarding/useOnboardingPage', () => ({
  hasSeenOnboarding: () => mockHasSeenOnboarding(),
}))

const mockUseAuth = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockHasSeenOnboarding.mockReturnValue(false)
  mockUseAuth.mockReturnValue({ user: null, loading: false })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function importHook() {
  const mod = await import('@/components/site/usePwaFirstLaunchGate')
  return mod.usePwaFirstLaunchGate
}

describe('usePwaFirstLaunchGate — non standalone', () => {
  it("ne redirige jamais en mode navigateur classique", async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
    mockUseAuth.mockReturnValue({ user: { id: 'u1' }, loading: false })
    const useHook = await importHook()
    renderHook(() => useHook())
    expect(mockRouterReplace).not.toHaveBeenCalled()
  })
})

describe('usePwaFirstLaunchGate — standalone (PWA)', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
  })

  it("ne redirige pas tant que la session est en chargement", async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true })
    const useHook = await importHook()
    renderHook(() => useHook())
    expect(mockRouterReplace).not.toHaveBeenCalled()
  })

  it("redirige vers /onboarding si onboarding non vu (priorite)", async () => {
    mockHasSeenOnboarding.mockReturnValue(false)
    mockUseAuth.mockReturnValue({ user: { id: 'u1' }, loading: false })
    const useHook = await importHook()
    renderHook(() => useHook())
    expect(mockRouterReplace).toHaveBeenCalledWith('/onboarding')
  })

  it("redirige vers /dashboard/chauffeur si connecte et onboarding vu", async () => {
    mockHasSeenOnboarding.mockReturnValue(true)
    mockUseAuth.mockReturnValue({ user: { id: 'u1' }, loading: false })
    const useHook = await importHook()
    renderHook(() => useHook())
    expect(mockRouterReplace).toHaveBeenCalledWith('/dashboard/chauffeur')
  })

  it("redirige vers /auth/login si pas connecte et onboarding vu", async () => {
    mockHasSeenOnboarding.mockReturnValue(true)
    mockUseAuth.mockReturnValue({ user: null, loading: false })
    const useHook = await importHook()
    renderHook(() => useHook())
    expect(mockRouterReplace).toHaveBeenCalledWith('/auth/login')
  })
})
