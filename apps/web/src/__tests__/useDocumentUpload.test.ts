import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type React from 'react'

const mockUploadFile = vi.fn()
const mockUpsertDocument = vi.fn()

vi.mock('@/services/documentService', () => ({
  documentService: {
    uploadFile:     (...a: unknown[]) => mockUploadFile(...a),
    upsertDocument: (...a: unknown[]) => mockUpsertDocument(...a),
  },
}))

import { useDocumentUpload } from '@/hooks/useDocumentUpload'

const mockOnSuccess = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockOnSuccess.mockResolvedValue(undefined)
})

const createEvent = (file?: File) =>
  ({ target: { files: file ? [file] : null, value: '' } }) as unknown as React.ChangeEvent<HTMLInputElement>

// ─── État initial ─────────────────────────────────────────────────────────────
describe('useDocumentUpload — état initial', () => {
  it('uploading est null au départ', () => {
    const { result } = renderHook(() => useDocumentUpload('u1', [], mockOnSuccess))
    expect(result.current.uploading).toBeNull()
  })

  it('error est vide au départ', () => {
    const { result } = renderHook(() => useDocumentUpload('u1', [], mockOnSuccess))
    expect(result.current.error).toBe('')
  })

  it('fileInputRef est défini', () => {
    const { result } = renderHook(() => useDocumentUpload('u1', [], mockOnSuccess))
    expect(result.current.fileInputRef).toBeDefined()
  })
})

// ─── triggerUpload ────────────────────────────────────────────────────────────
describe('useDocumentUpload — triggerUpload', () => {
  it('ne plante pas si fileInputRef.current est null', () => {
    const { result } = renderHook(() => useDocumentUpload('u1', [], mockOnSuccess))
    expect(() => {
      act(() => { result.current.triggerUpload('carte_pro') })
    }).not.toThrow()
  })
})

// ─── handleFileChange — gardes ────────────────────────────────────────────────
describe('useDocumentUpload — handleFileChange (gardes)', () => {
  it('ne fait rien si pas de fichier', async () => {
    const { result } = renderHook(() => useDocumentUpload('u1', [], mockOnSuccess))
    act(() => { result.current.triggerUpload('carte_pro') })
    await act(async () => { await result.current.handleFileChange(createEvent()) })
    expect(mockUploadFile).not.toHaveBeenCalled()
  })

  it('ne fait rien si userId est undefined', async () => {
    const { result } = renderHook(() => useDocumentUpload(undefined, [], mockOnSuccess))
    act(() => { result.current.triggerUpload('carte_pro') })
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' })
    await act(async () => { await result.current.handleFileChange(createEvent(file)) })
    expect(mockUploadFile).not.toHaveBeenCalled()
  })

  it('ne fait rien si triggerUpload n\'a pas été appelé', async () => {
    const { result } = renderHook(() => useDocumentUpload('u1', [], mockOnSuccess))
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' })
    await act(async () => { await result.current.handleFileChange(createEvent(file)) })
    expect(mockUploadFile).not.toHaveBeenCalled()
  })
})

// ─── handleFileChange — succès ────────────────────────────────────────────────
describe('useDocumentUpload — handleFileChange (succès)', () => {
  it('uploade le fichier et appelle onSuccess', async () => {
    mockUploadFile.mockResolvedValue('https://cdn.example.com/doc.pdf')
    mockUpsertDocument.mockResolvedValue(undefined)

    const { result } = renderHook(() => useDocumentUpload('u1', [], mockOnSuccess))
    act(() => { result.current.triggerUpload('carte_pro') })

    const file = new File(['x'], 'carte.pdf', { type: 'application/pdf' })
    await act(async () => { await result.current.handleFileChange(createEvent(file)) })

    expect(mockUploadFile).toHaveBeenCalledWith('u1', 'carte_pro', file)
    expect(mockUpsertDocument).toHaveBeenCalled()
    expect(mockOnSuccess).toHaveBeenCalled()
    expect(result.current.uploading).toBeNull()
    expect(result.current.error).toBe('')
  })

  it('upsert utilise l\'id du document existant', async () => {
    mockUploadFile.mockResolvedValue('https://cdn.example.com/new.pdf')
    mockUpsertDocument.mockResolvedValue(undefined)

    const existingDoc = { id: 'doc-42', type: 'assurance', status: 'valid' } as any
    const { result } = renderHook(() => useDocumentUpload('u1', [existingDoc], mockOnSuccess))
    act(() => { result.current.triggerUpload('assurance') })

    const file = new File(['x'], 'assurance.pdf', { type: 'application/pdf' })
    await act(async () => { await result.current.handleFileChange(createEvent(file)) })

    expect(mockUpsertDocument).toHaveBeenCalledWith(
      expect.objectContaining({ existingId: 'doc-42', type: 'assurance' })
    )
  })
})

// ─── handleFileChange — erreur ────────────────────────────────────────────────
describe('useDocumentUpload — handleFileChange (erreur)', () => {
  it('set error si uploadFile échoue', async () => {
    mockUploadFile.mockRejectedValue(new Error('Upload failed'))

    const { result } = renderHook(() => useDocumentUpload('u1', [], mockOnSuccess))
    act(() => { result.current.triggerUpload('permis') })

    const file = new File(['x'], 'permis.pdf', { type: 'application/pdf' })
    await act(async () => { await result.current.handleFileChange(createEvent(file)) })

    expect(result.current.error).toBe('Upload failed')
    expect(result.current.uploading).toBeNull()
  })

  it('set message générique si erreur non-Error', async () => {
    mockUploadFile.mockRejectedValue('oops')

    const { result } = renderHook(() => useDocumentUpload('u1', [], mockOnSuccess))
    act(() => { result.current.triggerUpload('ct') })

    const file = new File(['x'], 'ct.pdf', { type: 'application/pdf' })
    await act(async () => { await result.current.handleFileChange(createEvent(file)) })

    expect(result.current.error).toBe("Erreur lors de l'envoi")
  })
})
