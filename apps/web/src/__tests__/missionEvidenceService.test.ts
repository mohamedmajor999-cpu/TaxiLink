import { describe, it, expect, vi, beforeEach } from 'vitest'
import { missionEvidenceService } from '@/services/missionEvidenceService'

const mockStorageUpload = vi.fn()
const mockCreateSignedUrl = vi.fn()
const mockStorageFrom = vi.fn(() => ({
  upload: mockStorageUpload,
  createSignedUrl: mockCreateSignedUrl,
}))

const mockUpdateEq = vi.fn()
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }))
const mockFrom = vi.fn(() => ({ update: mockUpdate }))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
    storage: { from: mockStorageFrom },
  }),
}))

// 1×1 PNG transparent encode en base64. Suffit a fetch() qui renvoie un Blob.
const TINY_PNG_DATAURL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lxKUAAAAASUVORK5CYII='

beforeEach(() => {
  vi.clearAllMocks()
  mockStorageUpload.mockResolvedValue({ error: null })
  mockUpdateEq.mockResolvedValue({ error: null })
  mockCreateSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://signed.example/x' }, error: null })
})

describe('missionEvidenceService.uploadSignature', () => {
  it("upload sous <missionId>/signature.png et met a jour la mission", async () => {
    const path = await missionEvidenceService.uploadSignature('m1', TINY_PNG_DATAURL)
    expect(path).toBe('m1/signature.png')
    expect(mockStorageFrom).toHaveBeenCalledWith('mission-evidence')
    expect(mockStorageUpload).toHaveBeenCalledWith(
      'm1/signature.png',
      expect.any(Blob),
      expect.objectContaining({ contentType: 'image/png', upsert: true }),
    )
    expect(mockUpdate).toHaveBeenCalledWith({ pickup_signature_url: 'm1/signature.png' })
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'm1')
  })

  it('lève une erreur si Storage échoue', async () => {
    mockStorageUpload.mockResolvedValueOnce({ error: { message: 'Quota dépassé' } })
    await expect(missionEvidenceService.uploadSignature('m1', TINY_PNG_DATAURL))
      .rejects.toThrow('Quota dépassé')
  })

  it('lève une erreur si la mise à jour DB échoue', async () => {
    mockUpdateEq.mockResolvedValueOnce({ error: { message: 'RLS violation' } })
    await expect(missionEvidenceService.uploadSignature('m1', TINY_PNG_DATAURL))
      .rejects.toThrow('RLS violation')
  })
})

describe('missionEvidenceService.uploadVoucher', () => {
  function file(name: string, type: string, size = 100): File {
    const blob = new Blob([new Uint8Array(size)], { type })
    return new File([blob], name, { type })
  }

  it("upload une image JPEG sous <missionId>/voucher.jpg", async () => {
    const f = file('bon.jpg', 'image/jpeg')
    const path = await missionEvidenceService.uploadVoucher('m1', f)
    expect(path).toBe('m1/voucher.jpg')
    expect(mockUpdate).toHaveBeenCalledWith({ transport_voucher_url: 'm1/voucher.jpg' })
  })

  it('refuse un type non autorisé', async () => {
    const f = file('virus.exe', 'application/octet-stream')
    await expect(missionEvidenceService.uploadVoucher('m1', f))
      .rejects.toThrow('Format non autorisé')
    expect(mockStorageUpload).not.toHaveBeenCalled()
  })

  it('refuse un fichier > 8 Mo', async () => {
    const f = file('big.jpg', 'image/jpeg', 9 * 1024 * 1024)
    await expect(missionEvidenceService.uploadVoucher('m1', f))
      .rejects.toThrow('trop volumineux')
  })
})

describe('missionEvidenceService.getSignedUrl', () => {
  it('renvoie une signed URL temporaire', async () => {
    const url = await missionEvidenceService.getSignedUrl('m1/signature.png')
    expect(url).toBe('https://signed.example/x')
    expect(mockCreateSignedUrl).toHaveBeenCalledWith('m1/signature.png', expect.any(Number))
  })

  it('lève si Supabase échoue', async () => {
    mockCreateSignedUrl.mockResolvedValueOnce({ data: null, error: { message: 'Expired' } })
    await expect(missionEvidenceService.getSignedUrl('x')).rejects.toThrow('Expired')
  })
})
