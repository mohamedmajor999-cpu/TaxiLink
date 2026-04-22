import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseVoiceAnswer, type VoiceAnswerRequest, type VoiceAnswerResult } from '@/services/voiceAnswerService'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({ api: { post: vi.fn() } }))

beforeEach(() => { vi.clearAllMocks() })

describe('parseVoiceAnswer', () => {
  const baseRequest: VoiceAnswerRequest = {
    questionId: 'q-departure',
    kind: 'address',
    prompt: 'Adresse de départ ?',
    allQuestionIds: ['q-departure', 'q-destination', 'q-time'],
    transcript: 'Hôpital Timone Marseille',
  }

  it('POST la requête à /api/missions/parse-voice-answer et retourne le résultat', async () => {
    const expected: VoiceAnswerResult = {
      intent: 'answer',
      value: 'Hôpital Timone Marseille',
      targetQuestionId: null,
    }
    vi.mocked(api.post).mockResolvedValue(expected)

    const result = await parseVoiceAnswer(baseRequest)

    expect(api.post).toHaveBeenCalledWith('/api/missions/parse-voice-answer', baseRequest)
    expect(result).toEqual(expected)
  })

  it('transmet options et availableGroups quand fournis', async () => {
    const request: VoiceAnswerRequest = {
      ...baseRequest,
      kind: 'choice',
      options: [{ value: 'CPAM', label: 'CPAM' }, { value: 'PRIVE', label: 'Privé' }],
      availableGroups: [{ id: 'g1', name: 'Groupe A' }],
    }
    vi.mocked(api.post).mockResolvedValue({ intent: 'answer', value: 'CPAM', targetQuestionId: null })

    await parseVoiceAnswer(request)

    const payload = vi.mocked(api.post).mock.calls[0][1]
    expect(payload).toMatchObject({
      options: [{ value: 'CPAM', label: 'CPAM' }, { value: 'PRIVE', label: 'Privé' }],
      availableGroups: [{ id: 'g1', name: 'Groupe A' }],
    })
  })

  it('propage l intent "back" / "goto" / "skip" / "unclear"', async () => {
    vi.mocked(api.post).mockResolvedValue({
      intent: 'goto',
      value: null,
      targetQuestionId: 'q-time',
    })

    const result = await parseVoiceAnswer(baseRequest)

    expect(result.intent).toBe('goto')
    expect(result.targetQuestionId).toBe('q-time')
  })

  it('propage l erreur API sans la transformer', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('LLM indisponible'))

    await expect(parseVoiceAnswer(baseRequest)).rejects.toThrow('LLM indisponible')
  })
})
