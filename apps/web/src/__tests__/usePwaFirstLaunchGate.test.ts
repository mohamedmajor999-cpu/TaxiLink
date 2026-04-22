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

beforeEach(() => {
  vi.clearAllMocks()
  mockHasSeenOnboarding.mockReturnValue(false)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function importHook() {
  const mod = await import('@/components/site/usePwaFirstLaunchGate')
  return mod.usePwaFirstLaunchGate
}

describe('usePwaFirstLaunchGate', () => {
  it("ne redirige pas si pas standalone", async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
    const useHook = await importHook()
    renderHook(() => useHook())
    expect(mockRouterReplace).not.toHaveBeenCalled()
  })

  it("ne redirige pas si standalone mais onboarding déjà vu", async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
    mockHasSeenOnboarding.mockReturnValue(true)
    const useHook = await importHook()
    renderHook(() => useHook())
    expect(mockRouterReplace).not.toHaveBeenCalled()
  })

  it("redirige vers /onboarding si standalone et onboarding non vu", async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
    mockHasSeenOnboarding.mockReturnValue(false)
    const useHook = await importHook()
    renderHook(() => useHook())
    expect(mockRouterReplace).toHaveBeenCalledWith('/onboarding')
  })
})
