import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// ─── Mock SpeechRecognition ───────────────────────────────────────────────────
let srInstance: {
  lang: string; continuous: boolean; interimResults: boolean
  onresult: ((e: unknown) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  abort: ReturnType<typeof vi.fn>
}

vi.mock('@/lib/speechRecognition', () => ({
  getSpeechRecognitionCtor: () => class {
    constructor() {
      srInstance = {
        lang: '', continuous: false, interimResults: false,
        onresult: null, onerror: null, onend: null, onstart: null,
        start: vi.fn(), stop: vi.fn(), abort: vi.fn(),
      }
      return srInstance
    }
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('useVoiceDictation', () => {
  it('isSupported=true quand SpeechRecognition disponible', async () => {
    const { useVoiceDictation } = await import('@/hooks/useVoiceDictation')
    const { result } = renderHook(() =>
      useVoiceDictation({ onFinalTranscript: vi.fn() }),
    )
    expect(result.current.isSupported).toBe(true)
  })

  it('start appelle instance.start et isListening passe à true', async () => {
    const { useVoiceDictation } = await import('@/hooks/useVoiceDictation')
    const { result } = renderHook(() =>
      useVoiceDictation({ onFinalTranscript: vi.fn() }),
    )
    act(() => { result.current.start() })
    expect(srInstance.start).toHaveBeenCalled()
    // onstart déclenche isListening=true
    act(() => { srInstance.onstart?.() })
    expect(result.current.isListening).toBe(true)
  })

  it('stop appelle instance.stop', async () => {
    const { useVoiceDictation } = await import('@/hooks/useVoiceDictation')
    const { result } = renderHook(() =>
      useVoiceDictation({ onFinalTranscript: vi.fn() }),
    )
    act(() => { result.current.start() })
    act(() => { result.current.stop() })
    expect(srInstance.stop).toHaveBeenCalled()
  })

  it('onresult appelle onFinalTranscript pour les résultats finaux', async () => {
    const { useVoiceDictation } = await import('@/hooks/useVoiceDictation')
    const onFinalTranscript = vi.fn()
    renderHook(() => useVoiceDictation({ onFinalTranscript }))

    const fakeEvent = {
      resultIndex: 0,
      results: { length: 1, 0: { isFinal: true, 0: { transcript: 'bonjour monde' } } },
    }
    act(() => { srInstance.onresult?.(fakeEvent) })
    expect(onFinalTranscript).toHaveBeenCalledWith('bonjour monde')
  })

  it('onerror (non no-speech) met error à jour et isListening à false', async () => {
    const { useVoiceDictation } = await import('@/hooks/useVoiceDictation')
    const { result } = renderHook(() =>
      useVoiceDictation({ onFinalTranscript: vi.fn() }),
    )
    act(() => { srInstance.onerror?.({ error: 'not-allowed' }) })
    await waitFor(() => expect(result.current.error).toBe('not-allowed'))
    expect(result.current.isListening).toBe(false)
  })

  it('onend sans continuous remet isListening à false', async () => {
    const { useVoiceDictation } = await import('@/hooks/useVoiceDictation')
    const { result } = renderHook(() =>
      useVoiceDictation({ onFinalTranscript: vi.fn(), continuous: false }),
    )
    act(() => { result.current.start() })
    act(() => { srInstance.onstart?.() })
    act(() => { srInstance.onend?.() })
    expect(result.current.isListening).toBe(false)
  })
})
