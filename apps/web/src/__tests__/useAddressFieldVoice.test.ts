import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { AddressSuggestion } from '@/services/addressService'

let capturedOpts: { onStop?: (b: Blob) => void; onError?: (e: string) => void } = {}
const mockRecorderState = {
  isSupported: true,
  isRecording: false,
  start: vi.fn(),
  stop: vi.fn(),
}

vi.mock('@/hooks/useAudioRecorder', () => ({
  useAudioRecorder: vi.fn((opts) => {
    capturedOpts = opts
    return mockRecorderState
  }),
}))

const mockTranscribeAudioBlob = vi.fn()
vi.mock('@/services/transcribeService', () => ({
  transcribeAudioBlob: (...a: unknown[]) => mockTranscribeAudioBlob(...a),
}))

const mockSmartAddressLookup = vi.fn()
vi.mock('@/components/dashboard/driver/smartAddressLookup', () => ({
  smartAddressLookup: (...a: unknown[]) => mockSmartAddressLookup(...a),
}))

const SUGGESTION: AddressSuggestion = { label: '10 Rue de la Paix, Paris', lat: 48.87, lng: 2.33, score: 0.9 }
const fakeBlob = () => new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/webm' })

beforeEach(() => {
  vi.clearAllMocks()
  capturedOpts = {}
  mockRecorderState.isRecording = false
  mockTranscribeAudioBlob.mockResolvedValue({ text: '10 rue de la paix paris', elapsedMs: 100 })
  mockSmartAddressLookup.mockResolvedValue(SUGGESTION)
})

describe('useAddressFieldVoice', () => {
  it('start appelle recorder.start', async () => {
    const { useAddressFieldVoice } = await import('@/components/dashboard/driver/useAddressFieldVoice')
    const { result } = renderHook(() => useAddressFieldVoice({ onResolved: vi.fn(), onFallbackText: vi.fn() }))
    act(() => { result.current.start() })
    expect(mockRecorderState.start).toHaveBeenCalled()
  })

  it('stop appelle recorder.stop', async () => {
    const { useAddressFieldVoice } = await import('@/components/dashboard/driver/useAddressFieldVoice')
    const { result } = renderHook(() => useAddressFieldVoice({ onResolved: vi.fn(), onFallbackText: vi.fn() }))
    act(() => { result.current.stop() })
    expect(mockRecorderState.stop).toHaveBeenCalled()
  })

  it('isSupported reflète recorder.isSupported', async () => {
    const { useAddressFieldVoice } = await import('@/components/dashboard/driver/useAddressFieldVoice')
    const { result } = renderHook(() => useAddressFieldVoice({ onResolved: vi.fn(), onFallbackText: vi.fn() }))
    expect(result.current.isSupported).toBe(true)
  })

  it('appelle onResolved quand Whisper transcrit et smartAddressLookup trouve une suggestion', async () => {
    const { useAddressFieldVoice } = await import('@/components/dashboard/driver/useAddressFieldVoice')
    const onResolved = vi.fn()
    renderHook(() => useAddressFieldVoice({ onResolved, onFallbackText: vi.fn() }))

    await act(async () => { await capturedOpts.onStop?.(fakeBlob()) })

    await waitFor(() => expect(onResolved).toHaveBeenCalledWith(SUGGESTION))
    expect(mockTranscribeAudioBlob).toHaveBeenCalledTimes(1)
    expect(mockSmartAddressLookup).toHaveBeenCalledWith('10 rue de la paix paris')
  })

  it('appelle onFallbackText si smartAddressLookup retourne null', async () => {
    mockSmartAddressLookup.mockResolvedValue(null)
    const { useAddressFieldVoice } = await import('@/components/dashboard/driver/useAddressFieldVoice')
    const onFallbackText = vi.fn()
    mockTranscribeAudioBlob.mockResolvedValue({ text: 'adresse inconnue xyz', elapsedMs: 100 })

    renderHook(() => useAddressFieldVoice({ onResolved: vi.fn(), onFallbackText }))

    await act(async () => { await capturedOpts.onStop?.(fakeBlob()) })

    await waitFor(() => expect(onFallbackText).toHaveBeenCalledWith('adresse inconnue xyz'))
  })

  it('blob vide → ne déclenche ni transcribe ni lookup', async () => {
    const { useAddressFieldVoice } = await import('@/components/dashboard/driver/useAddressFieldVoice')
    renderHook(() => useAddressFieldVoice({ onResolved: vi.fn(), onFallbackText: vi.fn() }))
    await act(async () => {
      await capturedOpts.onStop?.(new Blob([], { type: 'audio/webm' }))
    })
    expect(mockTranscribeAudioBlob).not.toHaveBeenCalled()
  })

  it('texte trop court (< 3 chars) après transcription → ne déclenche pas le lookup', async () => {
    mockTranscribeAudioBlob.mockResolvedValue({ text: 'ok', elapsedMs: 100 })
    const { useAddressFieldVoice } = await import('@/components/dashboard/driver/useAddressFieldVoice')
    const onResolved = vi.fn()
    const onFallbackText = vi.fn()
    renderHook(() => useAddressFieldVoice({ onResolved, onFallbackText }))

    await act(async () => { await capturedOpts.onStop?.(fakeBlob()) })

    expect(mockSmartAddressLookup).not.toHaveBeenCalled()
    expect(onResolved).not.toHaveBeenCalled()
    expect(onFallbackText).not.toHaveBeenCalled()
  })
})
