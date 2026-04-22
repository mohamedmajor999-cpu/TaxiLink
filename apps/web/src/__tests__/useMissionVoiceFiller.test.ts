import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useMissionVoiceFiller } from '@/components/dashboard/driver/useMissionVoiceFiller'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockParseVoiceTranscript = vi.fn()
const mockSmartAddressLookup = vi.fn()

vi.mock('@/services/voiceParseService', () => ({
  parseVoiceTranscript: (...a: unknown[]) => mockParseVoiceTranscript(...a),
}))

vi.mock('@/components/dashboard/driver/smartAddressLookup', () => ({
  smartAddressLookup: (...a: unknown[]) => mockSmartAddressLookup(...a),
}))

let capturedVoiceOpts: { onFinalTranscript?: (text: string) => void } = {}
const mockVoiceState = {
  isSupported: true,
  isListening: false,
  interimTranscript: '',
  error: null as string | null,
  start: vi.fn(),
  stop: vi.fn(),
}

vi.mock('@/hooks/useVoiceDictation', () => ({
  useVoiceDictation: vi.fn((opts) => {
    capturedVoiceOpts = opts
    return mockVoiceState
  }),
}))

// micErrorLabel est une fonction exportée de voiceFillerHelpers - on ne la mocke pas
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

beforeEach(() => {
  vi.clearAllMocks()
  mockVoiceState.isListening = false
  mockVoiceState.error = null
  mockParseVoiceTranscript.mockResolvedValue({})
  mockSmartAddressLookup.mockResolvedValue(null)
  capturedVoiceOpts = {}
})

// ─── start / stop ─────────────────────────────────────────────────────────────
describe('useMissionVoiceFiller — start / stop', () => {
  it('start appelle voice.start et remet le transcript à zéro', () => {
    const { result } = renderHook(() => useMissionVoiceFiller(makeArgs()))
    act(() => { result.current.start() })
    expect(mockVoiceState.start).toHaveBeenCalled()
    expect(result.current.transcript).toBe('')
  })

  it('stop appelle voice.stop', () => {
    const { result } = renderHook(() => useMissionVoiceFiller(makeArgs()))
    act(() => { result.current.stop() })
    expect(mockVoiceState.stop).toHaveBeenCalled()
  })

  it('resetParsedFields vide le set parsedFields', async () => {
    const args = makeArgs()
    mockParseVoiceTranscript.mockResolvedValueOnce({ type: 'CPAM' })
    const { result, rerender } = renderHook(() => useMissionVoiceFiller(args))

    // Déclencher un parsing
    act(() => { result.current.start() })
    mockVoiceState.isListening = true
    act(() => { rerender() })
    act(() => { capturedVoiceOpts.onFinalTranscript?.('CPAM pour Mr Dupont') })
    mockVoiceState.isListening = false
    act(() => { rerender() })

    await waitFor(() => expect(result.current.isProcessing).toBe(false))

    act(() => { result.current.resetParsedFields() })
    expect(result.current.parsedFields.size).toBe(0)
  })
})

// ─── Traitement du transcript ─────────────────────────────────────────────────
describe('useMissionVoiceFiller — traitement', () => {
  it("isProcessing=true pendant le parsing, false après", async () => {
    let resolve!: (v: object) => void
    mockParseVoiceTranscript.mockImplementationOnce(
      () => new Promise<object>((res) => { resolve = res }),
    )

    const { result, rerender } = renderHook(() => useMissionVoiceFiller(makeArgs()))
    act(() => { result.current.start() })
    mockVoiceState.isListening = true
    act(() => { rerender() })
    act(() => { capturedVoiceOpts.onFinalTranscript?.('course CPAM demain') })
    mockVoiceState.isListening = false
    act(() => { rerender() })

    await waitFor(() => expect(result.current.isProcessing).toBe(true))
    await act(async () => { resolve({}) })
    expect(result.current.isProcessing).toBe(false)
  })

  it('parseError si parseVoiceTranscript rejette', async () => {
    mockParseVoiceTranscript.mockRejectedValueOnce(new Error('IA KO'))
    const { result, rerender } = renderHook(() => useMissionVoiceFiller(makeArgs()))

    act(() => { result.current.start() })
    mockVoiceState.isListening = true
    act(() => { rerender() })
    act(() => { capturedVoiceOpts.onFinalTranscript?.('course') })
    mockVoiceState.isListening = false
    act(() => { rerender() })

    await waitFor(() => expect(result.current.error).toBe('IA KO'))
  })

  it('type parsé → setType appelé', async () => {
    const args = makeArgs()
    mockParseVoiceTranscript.mockResolvedValueOnce({ type: 'PRIVE' })
    const { result, rerender } = renderHook(() => useMissionVoiceFiller(args))

    act(() => { result.current.start() })
    mockVoiceState.isListening = true
    act(() => { rerender() })
    act(() => { capturedVoiceOpts.onFinalTranscript?.('course privée') })
    mockVoiceState.isListening = false
    act(() => { rerender() })

    await waitFor(() => expect(args.setType).toHaveBeenCalledWith('PRIVE'))
  })
})
