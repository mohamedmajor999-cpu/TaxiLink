import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useMissionVoiceFiller } from '@/components/dashboard/driver/useMissionVoiceFiller'

const mockParseVoiceAudio = vi.fn()
const mockSmartAddressLookup = vi.fn()

vi.mock('@/services/voiceParseService', () => ({
  parseVoiceAudio: (...a: unknown[]) => mockParseVoiceAudio(...a),
}))

vi.mock('@/components/dashboard/driver/smartAddressLookup', () => ({
  smartAddressLookup: (...a: unknown[]) => mockSmartAddressLookup(...a),
}))

let capturedRecorderOpts: { onStop?: (b: Blob) => void; onError?: (e: string) => void } = {}
const mockRecorderState = {
  isSupported: true,
  isRecording: false,
  start: vi.fn(),
  stop: vi.fn(),
}

vi.mock('@/hooks/useAudioRecorder', () => ({
  useAudioRecorder: vi.fn((opts) => {
    capturedRecorderOpts = opts
    return mockRecorderState
  }),
}))

vi.mock('@/components/dashboard/driver/voiceFillerHelpers', () => ({
  matchGroupIds: vi.fn().mockReturnValue([]),
  micErrorLabel: (err: string | null) => err ? `Erreur micro (${err})` : null,
}))

function makeArgs() {
  return {
    setType: vi.fn(), setMedicalMotif: vi.fn(), setTransportType: vi.fn(),
    setReturnTrip: vi.fn(), setReturnTime: vi.fn(), setCompanion: vi.fn(),
    setPassengers: vi.fn(), setDeparture: vi.fn(), setDestination: vi.fn(),
    setDate: vi.fn(), setTime: vi.fn(), setPrice: vi.fn(), setPriceMin: vi.fn(),
    setPriceMax: vi.fn(), setPatientName: vi.fn(), setPhone: vi.fn(),
    setVisibility: vi.fn(), setGroupIds: vi.fn(),
    myGroups: [],
    setDepartureCoords: vi.fn(), setDestinationCoords: vi.fn(),
  }
}

const fakeBlob = () => new Blob([new Uint8Array([1, 2])], { type: 'audio/webm' })
const baseParsed = { transcript: 'course' }

beforeEach(() => {
  vi.clearAllMocks()
  mockRecorderState.isRecording = false
  mockParseVoiceAudio.mockResolvedValue(baseParsed)
  mockSmartAddressLookup.mockResolvedValue(null)
  capturedRecorderOpts = {}
})

describe('useMissionVoiceFiller — start / stop', () => {
  it('start appelle recorder.start et remet le transcript à zéro', () => {
    const { result } = renderHook(() => useMissionVoiceFiller(makeArgs()))
    act(() => { result.current.start() })
    expect(mockRecorderState.start).toHaveBeenCalled()
    expect(result.current.transcript).toBe('')
  })

  it('stop appelle recorder.stop', () => {
    const { result } = renderHook(() => useMissionVoiceFiller(makeArgs()))
    act(() => { result.current.stop() })
    expect(mockRecorderState.stop).toHaveBeenCalled()
  })

  it('resetParsedFields vide le set parsedFields', async () => {
    const args = makeArgs()
    mockParseVoiceAudio.mockResolvedValueOnce({ type: 'CPAM', transcript: 'CPAM pour Mr Dupont' })
    const { result } = renderHook(() => useMissionVoiceFiller(args))

    act(() => { result.current.start() })
    await act(async () => { await capturedRecorderOpts.onStop?.(fakeBlob()) })
    await waitFor(() => expect(result.current.isProcessing).toBe(false))

    act(() => { result.current.resetParsedFields() })
    expect(result.current.parsedFields.size).toBe(0)
  })
})

describe('useMissionVoiceFiller — traitement', () => {
  it('isProcessing=true pendant le parsing, false après', async () => {
    let resolve!: (v: object) => void
    mockParseVoiceAudio.mockImplementationOnce(
      () => new Promise<object>((res) => { resolve = res }),
    )

    const { result } = renderHook(() => useMissionVoiceFiller(makeArgs()))
    act(() => { result.current.start() })
    void capturedRecorderOpts.onStop?.(fakeBlob())

    await waitFor(() => expect(result.current.isProcessing).toBe(true))
    await act(async () => { resolve({ transcript: 'x' }) })
    await waitFor(() => expect(result.current.isProcessing).toBe(false))
  })

  it('parseError si parseVoiceAudio rejette', async () => {
    mockParseVoiceAudio.mockRejectedValueOnce(new Error('IA KO'))
    const { result } = renderHook(() => useMissionVoiceFiller(makeArgs()))

    act(() => { result.current.start() })
    await act(async () => { await capturedRecorderOpts.onStop?.(fakeBlob()) })

    await waitFor(() => expect(result.current.error).toBe('IA KO'))
  })

  it('type parsé → setType appelé', async () => {
    const args = makeArgs()
    mockParseVoiceAudio.mockResolvedValueOnce({ type: 'PRIVE', transcript: 'course privée' })
    const { result } = renderHook(() => useMissionVoiceFiller(args))

    act(() => { result.current.start() })
    await act(async () => { await capturedRecorderOpts.onStop?.(fakeBlob()) })

    await waitFor(() => expect(args.setType).toHaveBeenCalledWith('PRIVE'))
  })

  it('transcript renvoyé par le serveur est exposé sur le hook', async () => {
    mockParseVoiceAudio.mockResolvedValueOnce({ transcript: 'voici le texte transcrit' })
    const { result } = renderHook(() => useMissionVoiceFiller(makeArgs()))

    act(() => { result.current.start() })
    await act(async () => { await capturedRecorderOpts.onStop?.(fakeBlob()) })

    await waitFor(() => expect(result.current.transcript).toBe('voici le texte transcrit'))
  })

  it('blob vide ne déclenche pas de parse', async () => {
    const { result } = renderHook(() => useMissionVoiceFiller(makeArgs()))
    act(() => { result.current.start() })
    await act(async () => {
      await capturedRecorderOpts.onStop?.(new Blob([], { type: 'audio/webm' }))
    })
    expect(mockParseVoiceAudio).not.toHaveBeenCalled()
    expect(result.current.isProcessing).toBe(false)
  })

  it('erreur recorder est exposée via micErrorLabel', async () => {
    const { result } = renderHook(() => useMissionVoiceFiller(makeArgs()))
    act(() => { capturedRecorderOpts.onError?.('not-allowed') })
    await waitFor(() => expect(result.current.error).toBe('Erreur micro (not-allowed)'))
  })
})
