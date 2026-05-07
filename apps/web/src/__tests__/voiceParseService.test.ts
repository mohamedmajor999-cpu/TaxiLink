import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseVoiceAudio, type ParsedMissionFields } from '@/services/voiceParseService'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({ api: { postForm: vi.fn() } }))

const parsed: ParsedMissionFields = {
  type: 'CPAM',
  medical_motif: null,
  transport_type: null,
  return_trip: false,
  return_time: null,
  companion: false,
  passengers: 1,
  departure: 'Paris',
  destination: 'Lyon',
  date: '2026-05-01',
  time: '10:00',
  price_eur: 120,
  price_min_eur: null,
  price_max_eur: null,
  patient_name: null,
  phone: null,
  visibility: 'PUBLIC',
  group_names: [],
  extra_bagages: null,
  extra_encombrants: null,
  transcript: 'Paris Lyon le 1er mai à 10h',
}

beforeEach(() => { vi.clearAllMocks() })

describe('parseVoiceAudio', () => {
  it('POST un FormData audio à /api/missions/parse-voice et retourne la réponse', async () => {
    vi.mocked(api.postForm).mockResolvedValue(parsed)

    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/webm' })
    const result = await parseVoiceAudio(blob)

    expect(api.postForm).toHaveBeenCalledTimes(1)
    const [path, form] = vi.mocked(api.postForm).mock.calls[0]
    expect(path).toBe('/api/missions/parse-voice')
    expect(form).toBeInstanceOf(FormData)
    const file = (form as FormData).get('audio')
    expect(file).toBeInstanceOf(File)
    expect((file as File).type).toBe('audio/webm')
    expect((file as File).name).toBe('audio.webm')
    expect(result).toEqual(parsed)
  })

  it('utilise l extension mp4 quand le Blob est de type audio/mp4 (iOS Safari)', async () => {
    vi.mocked(api.postForm).mockResolvedValue(parsed)

    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/mp4' })
    await parseVoiceAudio(blob)

    const [, form] = vi.mocked(api.postForm).mock.calls[0]
    const file = (form as FormData).get('audio') as File
    expect(file.name).toBe('audio.mp4')
    expect(file.type).toBe('audio/mp4')
  })

  it('propage l erreur API sans la transformer', async () => {
    vi.mocked(api.postForm).mockRejectedValue(new Error('Parse LLM échoué'))

    const blob = new Blob([new Uint8Array([1])], { type: 'audio/webm' })
    await expect(parseVoiceAudio(blob)).rejects.toThrow('Parse LLM échoué')
  })
})
