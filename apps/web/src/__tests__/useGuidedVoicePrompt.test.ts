import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor, cleanup } from '@testing-library/react'
import { useGuidedVoicePrompt } from '@/components/dashboard/driver/guided/useGuidedVoicePrompt'

let ssMock: {
  cancel: ReturnType<typeof vi.fn>
  speak: ReturnType<typeof vi.fn>
  getVoices: ReturnType<typeof vi.fn>
  onvoiceschanged: null
}

beforeEach(() => {
  ssMock = {
    cancel: vi.fn(),
    speak: vi.fn(),
    getVoices: vi.fn().mockReturnValue([]),
    onvoiceschanged: null,
  }
  vi.stubGlobal('speechSynthesis', ssMock)
  vi.stubGlobal('SpeechSynthesisUtterance', class {
    lang = ''; voice = null; rate = 1; pitch = 1; volume = 1; onend = null; onerror = null
  })
})

afterEach(() => {
  // Démonter d'abord (cleanup du useEffect appelle speechSynthesis.cancel sur le mock actif),
  // puis retirer les stubs globaux.
  cleanup()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

// ─── isSupported ──────────────────────────────────────────────────────────────
describe('useGuidedVoicePrompt — isSupported', () => {
  it('isSupported=true quand speechSynthesis est disponible', async () => {
    const { result } = renderHook(() => useGuidedVoicePrompt())
    await waitFor(() => expect(result.current.isSupported).toBe(true))
  })
})

// ─── speak ────────────────────────────────────────────────────────────────────
describe('useGuidedVoicePrompt — speak', () => {
  it('speak appelle speechSynthesis.speak et passe isSpeaking à true', async () => {
    const { result } = renderHook(() => useGuidedVoicePrompt())
    await waitFor(() => expect(result.current.isSupported).toBe(true))

    act(() => { result.current.speak('bonjour') })

    expect(ssMock.speak).toHaveBeenCalled()
    expect(result.current.isSpeaking).toBe(true)
  })

  it("speak appelle speechSynthesis.cancel au préalable pour éviter chevauchement", async () => {
    const { result } = renderHook(() => useGuidedVoicePrompt())
    await waitFor(() => expect(result.current.isSupported).toBe(true))

    act(() => { result.current.speak('test') })
    expect(ssMock.cancel).toHaveBeenCalled()
  })
})

// ─── stop ─────────────────────────────────────────────────────────────────────
describe('useGuidedVoicePrompt — stop', () => {
  it('stop appelle speechSynthesis.cancel et remet isSpeaking à false', async () => {
    const { result } = renderHook(() => useGuidedVoicePrompt())
    await waitFor(() => expect(result.current.isSupported).toBe(true))

    act(() => { result.current.speak('test') })
    expect(result.current.isSpeaking).toBe(true)

    act(() => { result.current.stop() })
    expect(ssMock.cancel).toHaveBeenCalled()
    expect(result.current.isSpeaking).toBe(false)
  })
})

// ─── voiceName ────────────────────────────────────────────────────────────────
describe('useGuidedVoicePrompt — voiceName', () => {
  it('voiceName est null si aucune voix française disponible', async () => {
    const { result } = renderHook(() => useGuidedVoicePrompt())
    await waitFor(() => expect(result.current.isSupported).toBe(true))
    expect(result.current.voiceName).toBeNull()
  })
})
