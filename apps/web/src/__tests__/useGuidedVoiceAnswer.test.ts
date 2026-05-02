import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useGuidedVoiceAnswer } from '@/components/dashboard/driver/guided/useGuidedVoiceAnswer'
import type { GuidedQuestion } from '@/components/dashboard/driver/guided/guidedTypes'

const mockParseVoiceAnswer = vi.fn()

vi.mock('@/services/voiceAnswerService', () => ({
  parseVoiceAnswer: (...a: unknown[]) => mockParseVoiceAnswer(...a),
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

const fakeBlob = () => new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/webm' })

beforeEach(() => {
  vi.clearAllMocks()
  mockRecorderState.isRecording = false
  mockParseVoiceAnswer.mockResolvedValue({ intent: 'answer', value: 'CPAM', targetQuestionId: null, transcript: 'CPAM' })
  capturedRecorderOpts = {}
})

describe('useGuidedVoiceAnswer — start / stop', () => {
  it('start appelle recorder.start', () => {
    const { result } = renderHook(() => useGuidedVoiceAnswer(makeOpts()))
    act(() => { result.current.start() })
    expect(mockRecorderState.start).toHaveBeenCalled()
  })

  it('stop appelle recorder.stop', () => {
    const { result } = renderHook(() => useGuidedVoiceAnswer(makeOpts()))
    act(() => { result.current.stop() })
    expect(mockRecorderState.stop).toHaveBeenCalled()
  })

  it('isSupported expose recorder.isSupported', () => {
    const { result } = renderHook(() => useGuidedVoiceAnswer(makeOpts()))
    expect(result.current.isSupported).toBe(true)
  })
})

describe('useGuidedVoiceAnswer — micError', () => {
  it("error 'not-allowed' → message refus micro", async () => {
    const { result } = renderHook(() => useGuidedVoiceAnswer(makeOpts()))
    act(() => { capturedRecorderOpts.onError?.('not-allowed') })
    await waitFor(() => expect(result.current.error).toBe('Accès micro refusé.'))
  })

  it("error 'unsupported' → message non supporté", async () => {
    const { result } = renderHook(() => useGuidedVoiceAnswer(makeOpts()))
    act(() => { capturedRecorderOpts.onError?.('unsupported') })
    await waitFor(() => expect(result.current.error).toBe('Micro non supporté par ce navigateur.'))
  })

  it("error inconnue → message générique avec code", async () => {
    const { result } = renderHook(() => useGuidedVoiceAnswer(makeOpts()))
    act(() => { capturedRecorderOpts.onError?.('custom-error') })
    await waitFor(() => expect(result.current.error).toContain('custom-error'))
  })
})

describe('useGuidedVoiceAnswer — traitement audio', () => {
  it('audio reçu → parseVoiceAnswer appelé avec meta + blob, puis onResult', async () => {
    const onResult = vi.fn()
    renderHook(() => useGuidedVoiceAnswer(makeOpts({ onResult })))

    await act(async () => { await capturedRecorderOpts.onStop?.(fakeBlob()) })

    await waitFor(() => expect(onResult).toHaveBeenCalledWith(
      expect.objectContaining({ intent: 'answer', value: 'CPAM' }),
    ))
    expect(mockParseVoiceAnswer).toHaveBeenCalledTimes(1)
    const [meta, blob] = mockParseVoiceAnswer.mock.calls[0]
    expect(meta).toMatchObject({ questionId: 'type', kind: 'choice' })
    expect(blob).toBeInstanceOf(Blob)
  })

  it('blob vide → ne déclenche pas de parse', async () => {
    renderHook(() => useGuidedVoiceAnswer(makeOpts()))
    await act(async () => {
      await capturedRecorderOpts.onStop?.(new Blob([], { type: 'audio/webm' }))
    })
    expect(mockParseVoiceAnswer).not.toHaveBeenCalled()
  })

  it('parseError si parseVoiceAnswer rejette', async () => {
    mockParseVoiceAnswer.mockRejectedValueOnce(new Error('IA KO'))
    const { result } = renderHook(() => useGuidedVoiceAnswer(makeOpts()))

    await act(async () => { await capturedRecorderOpts.onStop?.(fakeBlob()) })

    await waitFor(() => expect(result.current.error).toBe('IA KO'))
  })
})
