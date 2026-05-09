import { describe, it, expect, vi, beforeEach } from 'vitest'
import { transcribeAudioBlob } from '@/services/transcribeService'

const { mockPostForm } = vi.hoisted(() => ({ mockPostForm: vi.fn() }))

vi.mock('@/lib/api', () => ({
  api: { postForm: mockPostForm, get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('transcribeService.transcribeAudioBlob', () => {
  it('POST /api/missions/transcribe avec un FormData contenant le blob audio', async () => {
    mockPostForm.mockResolvedValue({ text: 'bonjour', elapsedMs: 250 })
    const blob = new Blob(['fake-audio'], { type: 'audio/webm' })
    const result = await transcribeAudioBlob(blob)
    expect(result).toEqual({ text: 'bonjour', elapsedMs: 250 })
    expect(mockPostForm).toHaveBeenCalledTimes(1)
    const [path, form] = mockPostForm.mock.calls[0]
    expect(path).toBe('/api/missions/transcribe')
    expect(form).toBeInstanceOf(FormData)
    const file = (form as FormData).get('audio') as File
    expect(file).toBeInstanceOf(File)
    expect(file.name).toBe('audio.webm')
    expect(file.type).toBe('audio/webm')
  })

  it('detecte mp4 a partir du content-type', async () => {
    mockPostForm.mockResolvedValue({ text: '', elapsedMs: 100 })
    const blob = new Blob(['x'], { type: 'audio/mp4' })
    await transcribeAudioBlob(blob)
    const file = (mockPostForm.mock.calls[0][1] as FormData).get('audio') as File
    expect(file.name).toBe('audio.mp4')
  })

  it('fallback type webm si blob.type vide', async () => {
    mockPostForm.mockResolvedValue({ text: '', elapsedMs: 100 })
    const blob = new Blob(['x'])
    await transcribeAudioBlob(blob)
    const file = (mockPostForm.mock.calls[0][1] as FormData).get('audio') as File
    expect(file.name).toBe('audio.webm')
    expect(file.type).toBe('audio/webm')
  })

  it('propage les erreurs api', async () => {
    mockPostForm.mockRejectedValue(new Error('413 Payload Too Large'))
    const blob = new Blob(['x'])
    await expect(transcribeAudioBlob(blob)).rejects.toThrow('413 Payload Too Large')
  })
})
