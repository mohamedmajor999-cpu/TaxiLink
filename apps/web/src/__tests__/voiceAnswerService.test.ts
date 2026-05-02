import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseVoiceAnswer, type VoiceAnswerRequest, type VoiceAnswerResult } from '@/services/voiceAnswerService'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({ api: { postForm: vi.fn() } }))

beforeEach(() => { vi.clearAllMocks() })

const fakeBlob = (mime = 'audio/webm') => new Blob([new Uint8Array([1, 2, 3])], { type: mime })

describe('parseVoiceAnswer', () => {
  const baseRequest: VoiceAnswerRequest = {
    questionId: 'q-departure',
    kind: 'address',
    prompt: 'Adresse de départ ?',
    allQuestionIds: ['q-departure', 'q-destination', 'q-time'],
  }

  it('POST FormData (audio + meta JSON) à /api/missions/parse-voice-answer', async () => {
    const expected: VoiceAnswerResult = {
      intent: 'answer',
      value: 'Hôpital Timone Marseille',
      targetQuestionId: null,
      transcript: 'hôpital timone marseille',
    }
    vi.mocked(api.postForm).mockResolvedValue(expected)

    const result = await parseVoiceAnswer(baseRequest, fakeBlob())

    expect(api.postForm).toHaveBeenCalledTimes(1)
    const [path, form] = vi.mocked(api.postForm).mock.calls[0]
    expect(path).toBe('/api/missions/parse-voice-answer')
    expect(form).toBeInstanceOf(FormData)
    const audio = (form as FormData).get('audio')
    expect(audio).toBeInstanceOf(File)
    expect((audio as File).name).toBe('audio.webm')
    const meta = JSON.parse(((form as FormData).get('meta') ?? '') as string)
    expect(meta).toMatchObject({ questionId: 'q-departure', kind: 'address' })
    expect(result).toEqual(expected)
  })

  it('encode options et availableGroups dans le meta JSON', async () => {
    const request: VoiceAnswerRequest = {
      ...baseRequest,
      kind: 'choice',
      options: [{ value: 'CPAM', label: 'CPAM' }, { value: 'PRIVE', label: 'Privé' }],
      availableGroups: [{ id: 'g1', name: 'Groupe A' }],
    }
    vi.mocked(api.postForm).mockResolvedValue({
      intent: 'answer', value: 'CPAM', targetQuestionId: null, transcript: 'CPAM',
    })

    await parseVoiceAnswer(request, fakeBlob())

    const [, form] = vi.mocked(api.postForm).mock.calls[0]
    const meta = JSON.parse(((form as FormData).get('meta') ?? '') as string)
    expect(meta).toMatchObject({
      options: [{ value: 'CPAM', label: 'CPAM' }, { value: 'PRIVE', label: 'Privé' }],
      availableGroups: [{ id: 'g1', name: 'Groupe A' }],
    })
  })

  it('utilise l extension mp4 quand le Blob est de type audio/mp4', async () => {
    vi.mocked(api.postForm).mockResolvedValue({ intent: 'unclear', value: null, targetQuestionId: null, transcript: '' })

    await parseVoiceAnswer(baseRequest, fakeBlob('audio/mp4'))

    const [, form] = vi.mocked(api.postForm).mock.calls[0]
    const audio = (form as FormData).get('audio') as File
    expect(audio.name).toBe('audio.mp4')
    expect(audio.type).toBe('audio/mp4')
  })

  it('propage l erreur API sans la transformer', async () => {
    vi.mocked(api.postForm).mockRejectedValue(new Error('LLM indisponible'))

    await expect(parseVoiceAnswer(baseRequest, fakeBlob())).rejects.toThrow('LLM indisponible')
  })
})
