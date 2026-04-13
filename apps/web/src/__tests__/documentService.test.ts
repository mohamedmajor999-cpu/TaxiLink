import { describe, it, expect, vi, beforeEach } from 'vitest'
import { documentService } from '@/services/documentService'

// ─── Mock Supabase ─────────────────────────────────────────────────────────────
const { mockFrom, mockSelect, mockInsert, mockUpdate, mockEq, mockOrder,
        mockUpload, mockGetPublicUrl, mockStorage } = vi.hoisted(() => {
  const mockUpload      = vi.fn()
  const mockGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/file.pdf' } })
  const mockBucket      = vi.fn().mockReturnValue({ upload: mockUpload, getPublicUrl: mockGetPublicUrl })
  return {
    mockFrom:         vi.fn(),
    mockSelect:       vi.fn(),
    mockInsert:       vi.fn(),
    mockUpdate:       vi.fn(),
    mockEq:           vi.fn(),
    mockOrder:        vi.fn(),
    mockUpload,
    mockGetPublicUrl,
    mockStorage:      mockBucket,
  }
})

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom, storage: { from: mockStorage } }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockOrder.mockResolvedValue({ data: [], error: null })
  mockEq.mockReturnValue({ order: mockOrder })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockInsert.mockResolvedValue({ error: null })
  mockUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
  mockFrom.mockReturnValue({ select: mockSelect, insert: mockInsert, update: mockUpdate })
  mockUpload.mockResolvedValue({ error: null })
  mockStorage.mockReturnValue({ upload: mockUpload, getPublicUrl: mockGetPublicUrl })
})

// ─── getDocuments ─────────────────────────────────────────────────────────────
describe('documentService.getDocuments', () => {
  it('retourne les documents du chauffeur', async () => {
    const fakeDocs = [{ id: 'doc1', driver_id: 'd1', type: 'carte_grise', status: 'pending' }]
    mockOrder.mockResolvedValue({ data: fakeDocs, error: null })
    const result = await documentService.getDocuments('d1')
    expect(result).toEqual(fakeDocs)
    expect(mockFrom).toHaveBeenCalledWith('driver_documents')
  })

  it('retourne un tableau vide si data est null', async () => {
    mockOrder.mockResolvedValue({ data: null, error: null })
    const result = await documentService.getDocuments('d1')
    expect(result).toEqual([])
  })

  it('leve une erreur si Supabase echoue', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'Acces refuse' } })
    await expect(documentService.getDocuments('d1')).rejects.toThrow('Acces refuse')
  })
})

// ─── uploadFile — validation ──────────────────────────────────────────────────
describe('documentService.uploadFile — validation', () => {
  const makeFile = (type: string, size = 1024) =>
    ({ name: 'test.pdf', type, size }) as File

  it('refuse les types non autorises', async () => {
    await expect(documentService.uploadFile('u1', 'carte_grise', makeFile('text/html')))
      .rejects.toThrow('Type de fichier non autorisé')
  })

  it('refuse les fichiers trop volumineux', async () => {
    await expect(documentService.uploadFile('u1', 'carte_grise', makeFile('application/pdf', 11 * 1024 * 1024)))
      .rejects.toThrow('Fichier trop volumineux')
  })

  it('retourne une URL publique apres upload reussi', async () => {
    const url = await documentService.uploadFile('u1', 'carte_grise', makeFile('application/pdf'))
    expect(url).toBe('https://cdn.example.com/file.pdf')
    expect(mockUpload).toHaveBeenCalledOnce()
  })

  it('leve une erreur si l upload echoue', async () => {
    mockUpload.mockResolvedValue({ error: { message: 'Stockage plein' } })
    await expect(documentService.uploadFile('u1', 'carte_grise', makeFile('image/jpeg')))
      .rejects.toThrow('Stockage plein')
  })
})

// ─── upsertDocument ───────────────────────────────────────────────────────────
describe('documentService.upsertDocument', () => {
  const base = { driverId: 'd1', type: 'carte_grise', label: 'Carte grise', fileUrl: 'https://cdn.example.com/f.pdf' }

  it('cree un nouveau document si pas d existingId', async () => {
    await expect(documentService.upsertDocument(base)).resolves.toBeUndefined()
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ driver_id: 'd1', type: 'carte_grise' }))
  })

  it('met a jour un document existant si existingId fourni', async () => {
    const mockEqUpdate = vi.fn().mockResolvedValue({ error: null })
    mockUpdate.mockReturnValue({ eq: mockEqUpdate })
    await expect(documentService.upsertDocument({ ...base, existingId: 'doc-1' })).resolves.toBeUndefined()
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending', file_url: base.fileUrl }))
  })

  it('leve une erreur si insert echoue', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'Contrainte violee' } })
    await expect(documentService.upsertDocument(base)).rejects.toThrow('Contrainte violee')
  })
})
