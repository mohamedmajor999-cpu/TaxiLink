import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseVoiceTranscript, type ParsedMissionFields } from '@/services/voiceParseService'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({ api: { post: vi.fn() } }))

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
}

beforeEach(() => { vi.clearAllMocks() })

describe('parseVoiceTranscript', () => {
  it('POST le transcript à /api/missions/parse-voice et retourne la réponse', async () => {
    vi.mocked(api.post).mockResolvedValue(parsed)

    const result = await parseVoiceTranscript('Paris Lyon le 1er mai à 10h')

    expect(api.post).toHaveBeenCalledWith('/api/missions/parse-voice', {
      transcript: 'Paris Lyon le 1er mai à 10h',
    })
    expect(result).toEqual(parsed)
  })

  it('propage l erreur API sans la transformer', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('Parse LLM échoué'))

    await expect(parseVoiceTranscript('xxx')).rejects.toThrow('Parse LLM échoué')
  })

  it('passe le transcript tel quel (sans trim ni normalisation)', async () => {
    vi.mocked(api.post).mockResolvedValue(parsed)

    await parseVoiceTranscript('  Paris  ')

    expect(api.post).toHaveBeenCalledWith('/api/missions/parse-voice', {
      transcript: '  Paris  ',
    })
  })
})
