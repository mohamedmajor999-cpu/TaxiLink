import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useGuidedVoiceAnswer } from '@/components/dashboard/driver/guided/useGuidedVoiceAnswer'
import type { GuidedQuestion } from '@/components/dashboard/driver/guided/guidedTypes'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockParseVoiceAnswer = vi.fn()

vi.mock('@/services/voiceAnswerService', () => ({
  parseVoiceAnswer: (...a: unknown[]) => mockParseVoiceAnswer(...a),
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

const QUESTION: GuidedQuestion = {
  id: 'type', category: 'type',
  prompt: 'CPAM ou Privé ?', shortLabel: 'Type',
  kind: 'choice', isVisible: () => true,
}

function makeOpts(overrides = {}) {
  return {
    question: QUESTION,
    allQuestionIds: ['type', 'phone', 'departure'],
    myGroups: [],
    onResult: vi.fn(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockVoiceState.isListening = false
  mockVoiceState.error = null
  mockParseVoiceAnswer.mockResolvedValue({ intent: 'answer', value: 'CPAM' })
})

// ─── start / stop ─────────────────────────────────────────────────────────────
describe('useGuidedVoiceAnswer — start / stop', () => {
  it('start appelle voice.start', () => {
    const { result } = renderHook(() => useGuidedVoiceAnswer(makeOpts()))
    act(() => { result.current.start() })
    expect(mockVoiceState.start).toHaveBeenCalled()
  })

  it('stop appelle voice.stop', () => {
    const { result } = renderHook(() => useGuidedVoiceAnswer(makeOpts()))
    act(() => { result.current.stop() })
    expect(mockVoiceState.stop).toHaveBeenCalled()
  })

  it('isSupported expose voice.isSupported', () => {
    const { result } = renderHook(() => useGuidedVoiceAnswer(makeOpts()))
    expect(result.current.isSupported).toBe(true)
  })
})

// ─── micError ─────────────────────────────────────────────────────────────────
describe('useGuidedVoiceAnswer — micError', () => {
  it("error='no-speech' → message humain", () => {
    mockVoiceState.error = 'no-speech'
    const { result } = renderHook(() => useGuidedVoiceAnswer(makeOpts()))
    expect(result.current.error).toBe('Aucune voix détectée.')
  })

  it("error='not-allowed' → message refus micro", () => {
    mockVoiceState.error = 'not-allowed'
    const { result } = renderHook(() => useGuidedVoiceAnswer(makeOpts()))
    expect(result.current.error).toBe('Accès micro refusé.')
  })

  it("error inconnue → message générique", () => {
    mockVoiceState.error = 'custom-error'
    const { result } = renderHook(() => useGuidedVoiceAnswer(makeOpts()))
    expect(result.current.error).toContain('custom-error')
  })
})

// ─── Traitement de transcript ──────────────────────────────────────────────────
describe('useGuidedVoiceAnswer — traitement transcript', () => {
  it('quand voice.isListening passe à false et transcript existe → parse + onResult', async () => {
    const onResult = vi.fn()
    const { result, rerender } = renderHook(() => useGuidedVoiceAnswer(makeOpts({ onResult })))

    // Simuler phase d'écoute
    mockVoiceState.isListening = true
    act(() => { rerender() })
    act(() => { capturedVoiceOpts.onFinalTranscript?.('CPAM') })

    // Simuler fin d'écoute
    mockVoiceState.isListening = false
    act(() => { rerender() })

    await waitFor(() => expect(onResult).toHaveBeenCalledWith({ intent: 'answer', value: 'CPAM' }))
    expect(mockParseVoiceAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ transcript: 'CPAM', questionId: 'type' }),
    )
  })

  it('parseError si parseVoiceAnswer rejette', async () => {
    mockParseVoiceAnswer.mockRejectedValueOnce(new Error('IA KO'))
    const { result, rerender } = renderHook(() => useGuidedVoiceAnswer(makeOpts()))

    mockVoiceState.isListening = true
    act(() => { rerender() })
    act(() => { capturedVoiceOpts.onFinalTranscript?.('test') })
    mockVoiceState.isListening = false
    act(() => { rerender() })

    await waitFor(() => expect(result.current.error).toBe('IA KO'))
  })
})
