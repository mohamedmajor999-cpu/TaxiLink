import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// ─── Mocks ───────────────────────────────────────────────────────────────────
const mockTts = {
  speak: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn(),
  isSupported: true,
  isSpeaking: false,
}
vi.mock('@/components/dashboard/driver/guided/useGuidedVoicePrompt', () => ({
  useGuidedVoicePrompt: () => mockTts,
}))

const mockGetMissing = vi.fn()
vi.mock('@/components/dashboard/driver/vocal/missingCriticalFields', () => ({
  getMissingCriticalFields: (...a: unknown[]) => mockGetMissing(...a),
}))

const mockFiller = {
  isListening: false,
  isProcessing: false,
  error: null,
  parsedFields: {},
  transcript: '',
  interimTranscript: '',
  start: vi.fn(),
  stop: vi.fn(),
  resetParsedFields: vi.fn(),
}

function makeFiller() { return { ...mockFiller } }

beforeEach(() => {
  vi.clearAllMocks()
  mockGetMissing.mockReturnValue([])
  Object.assign(mockFiller, {
    isListening: false, isProcessing: false, error: null,
    parsedFields: {}, transcript: '', interimTranscript: '',
  })
})

describe('useVoiceFreeFlow', () => {
  it("status='idle' au départ", async () => {
    const { useVoiceFreeFlow } = await import('@/components/dashboard/driver/vocal/useVoiceFreeFlow')
    const filler = makeFiller()
    const { result } = renderHook(() =>
      useVoiceFreeFlow({ filler, snapshot: vi.fn().mockReturnValue({}), onComplete: vi.fn() }),
    )
    expect(result.current.status).toBe('idle')
  })

  it("start() passe status à 'listening' et appelle filler.start", async () => {
    const { useVoiceFreeFlow } = await import('@/components/dashboard/driver/vocal/useVoiceFreeFlow')
    const filler = makeFiller()
    const { result } = renderHook(() =>
      useVoiceFreeFlow({ filler, snapshot: vi.fn().mockReturnValue({}), onComplete: vi.fn() }),
    )
    act(() => { result.current.start() })
    expect(result.current.status).toBe('listening')
    expect(filler.start).toHaveBeenCalled()
  })

  it("stop() passe status à 'idle' et appelle tts.stop + filler.stop", async () => {
    const { useVoiceFreeFlow } = await import('@/components/dashboard/driver/vocal/useVoiceFreeFlow')
    const filler = makeFiller()
    const { result } = renderHook(() =>
      useVoiceFreeFlow({ filler, snapshot: vi.fn().mockReturnValue({}), onComplete: vi.fn() }),
    )
    act(() => { result.current.start() })
    act(() => { result.current.stop() })
    expect(result.current.status).toBe('idle')
    expect(mockTts.stop).toHaveBeenCalled()
    expect(filler.stop).toHaveBeenCalled()
  })

  it("skipToPreview appelle filler.stop et tts.stop", async () => {
    const { useVoiceFreeFlow } = await import('@/components/dashboard/driver/vocal/useVoiceFreeFlow')
    const filler = makeFiller()
    const { result } = renderHook(() =>
      useVoiceFreeFlow({ filler, snapshot: vi.fn().mockReturnValue({}), onComplete: vi.fn() }),
    )
    act(() => { result.current.start() })
    act(() => { result.current.skipToPreview() })
    expect(mockTts.stop).toHaveBeenCalled()
    expect(filler.stop).toHaveBeenCalled()
  })

  it('maxRelances est 3', async () => {
    const { useVoiceFreeFlow } = await import('@/components/dashboard/driver/vocal/useVoiceFreeFlow')
    const filler = makeFiller()
    const { result } = renderHook(() =>
      useVoiceFreeFlow({ filler, snapshot: vi.fn().mockReturnValue({}), onComplete: vi.fn() }),
    )
    expect(result.current.maxRelances).toBe(3)
  })
})
