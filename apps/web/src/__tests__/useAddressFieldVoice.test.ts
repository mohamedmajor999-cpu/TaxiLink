import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { AddressSuggestion } from '@/services/addressService'

// ─── Mocks ───────────────────────────────────────────────────────────────────
const mockVoiceStart = vi.fn()
const mockVoiceStop = vi.fn()
let capturedOpts: { onFinalTranscript?: (t: string) => void } = {}
let voiceIsListening = false

vi.mock('@/hooks/useVoiceDictation', () => ({
  useVoiceDictation: vi.fn((opts) => {
    capturedOpts = opts
    return {
      isSupported: true,
      isListening: voiceIsListening,
      error: null,
      start: mockVoiceStart,
      stop: mockVoiceStop,
      interimTranscript: '',
    }
  }),
}))

const mockSmartAddressLookup = vi.fn()
vi.mock('@/components/dashboard/driver/smartAddressLookup', () => ({
  smartAddressLookup: (...a: unknown[]) => mockSmartAddressLookup(...a),
}))

const SUGGESTION: AddressSuggestion = { label: '10 Rue de la Paix, Paris', lat: 48.87, lng: 2.33, placeId: null }

beforeEach(() => {
  vi.clearAllMocks()
  capturedOpts = {}
  voiceIsListening = false
  mockSmartAddressLookup.mockResolvedValue(SUGGESTION)
})

describe('useAddressFieldVoice', () => {
  it('start appelle voice.start', async () => {
    const { useAddressFieldVoice } = await import('@/components/dashboard/driver/useAddressFieldVoice')
    const { result } = renderHook(() => useAddressFieldVoice({ onResolved: vi.fn(), onFallbackText: vi.fn() }))
    act(() => { result.current.start() })
    expect(mockVoiceStart).toHaveBeenCalled()
  })

  it('stop appelle voice.stop', async () => {
    const { useAddressFieldVoice } = await import('@/components/dashboard/driver/useAddressFieldVoice')
    const { result } = renderHook(() => useAddressFieldVoice({ onResolved: vi.fn(), onFallbackText: vi.fn() }))
    act(() => { result.current.stop() })
    expect(mockVoiceStop).toHaveBeenCalled()
  })

  it('isSupported reflète voice.isSupported', async () => {
    const { useAddressFieldVoice } = await import('@/components/dashboard/driver/useAddressFieldVoice')
    const { result } = renderHook(() => useAddressFieldVoice({ onResolved: vi.fn(), onFallbackText: vi.fn() }))
    expect(result.current.isSupported).toBe(true)
  })

  it('appelle onResolved si smartAddressLookup trouve une suggestion', async () => {
    const { useVoiceDictation } = await import('@/hooks/useVoiceDictation')
    const { useAddressFieldVoice } = await import('@/components/dashboard/driver/useAddressFieldVoice')
    const onResolved = vi.fn()

    // Mount avec isListening=true pour que l'effect guard s'active
    voiceIsListening = true
    ;(useVoiceDictation as ReturnType<typeof vi.fn>).mockImplementation((opts) => {
      capturedOpts = opts
      return { isSupported: true, isListening: voiceIsListening, error: null, start: mockVoiceStart, stop: mockVoiceStop, interimTranscript: '' }
    })

    const { result, rerender } = renderHook(() => useAddressFieldVoice({ onResolved, onFallbackText: vi.fn() }))

    // start() → shouldProcessRef=true + accumule transcript
    act(() => { result.current.start() })
    act(() => { capturedOpts.onFinalTranscript?.('10 rue de la paix paris') })

    // Transition isListening: true→false → effect traite le transcript
    voiceIsListening = false
    ;(useVoiceDictation as ReturnType<typeof vi.fn>).mockImplementation((opts) => {
      capturedOpts = opts
      return { isSupported: true, isListening: false, error: null, start: mockVoiceStart, stop: mockVoiceStop, interimTranscript: '' }
    })
    rerender()

    await waitFor(() => expect(onResolved).toHaveBeenCalledWith(SUGGESTION))
  })

  it('appelle onFallbackText si smartAddressLookup retourne null', async () => {
    mockSmartAddressLookup.mockResolvedValue(null)
    const { useVoiceDictation } = await import('@/hooks/useVoiceDictation')
    const { useAddressFieldVoice } = await import('@/components/dashboard/driver/useAddressFieldVoice')
    const onFallbackText = vi.fn()

    voiceIsListening = true
    ;(useVoiceDictation as ReturnType<typeof vi.fn>).mockImplementation((opts) => {
      capturedOpts = opts
      return { isSupported: true, isListening: voiceIsListening, error: null, start: mockVoiceStart, stop: mockVoiceStop, interimTranscript: '' }
    })

    const { result, rerender } = renderHook(() => useAddressFieldVoice({ onResolved: vi.fn(), onFallbackText }))

    act(() => { result.current.start() })
    act(() => { capturedOpts.onFinalTranscript?.('adresse inconnue xyz') })

    voiceIsListening = false
    ;(useVoiceDictation as ReturnType<typeof vi.fn>).mockImplementation((opts) => {
      capturedOpts = opts
      return { isSupported: true, isListening: false, error: null, start: mockVoiceStart, stop: mockVoiceStop, interimTranscript: '' }
    })
    rerender()

    await waitFor(() => expect(onFallbackText).toHaveBeenCalledWith('adresse inconnue xyz'))
  })
})
