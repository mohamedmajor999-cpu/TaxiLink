import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDriverDocuments } from '@/components/dashboard/driver/useDriverDocuments'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockGetDocuments = vi.fn()
const mockTriggerUpload = vi.fn()
const mockHandleFileChange = vi.fn()
const fileInputRef = { current: null }

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/services/documentService', () => ({
  documentService: { getDocuments: (...a: unknown[]) => mockGetDocuments(...a) },
}))

vi.mock('@/hooks/useDocumentUpload', () => ({
  useDocumentUpload: vi.fn(),
}))

import { useAuth } from '@/hooks/useAuth'
import { useDocumentUpload } from '@/hooks/useDocumentUpload'
const mockUseAuth           = vi.mocked(useAuth)
const mockUseDocumentUpload = vi.mocked(useDocumentUpload)

beforeEach(() => {
  vi.clearAllMocks()
  mockUseDocumentUpload.mockReturnValue({
    uploading: false,
    error: null,
    fileInputRef,
    triggerUpload: mockTriggerUpload,
    handleFileChange: mockHandleFileChange,
  } as ReturnType<typeof useDocumentUpload>)
})

// ─── État initial ─────────────────────────────────────────────────────────────
describe('useDriverDocuments — état initial', () => {
  it('démarre en loading avec 0 document', () => {
    mockUseAuth.mockReturnValue({ user: null } as ReturnType<typeof useAuth>)
    mockGetDocuments.mockResolvedValue([])

    const { result } = renderHook(() => useDriverDocuments())

    expect(result.current.loading).toBe(true)
    expect(result.current.docs).toHaveLength(0)
  })

  it('expose les 5 types de documents définis dans DOC_CONFIG', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } } as ReturnType<typeof useAuth>)
    mockGetDocuments.mockResolvedValue([])

    const { result } = renderHook(() => useDriverDocuments())
    await act(async () => {})

    expect(result.current.allTypes).toHaveLength(5)
    expect(result.current.allTypes).toContain('carte_pro')
    expect(result.current.allTypes).toContain('assurance')
    expect(result.current.allTypes).toContain('permis')
  })
})

// ─── Chargement documents ─────────────────────────────────────────────────────
describe('useDriverDocuments — chargement', () => {
  it('charge les documents de l\'utilisateur connecté', async () => {
    const user = { id: 'drv-1' }
    mockUseAuth.mockReturnValue({ user } as ReturnType<typeof useAuth>)
    mockGetDocuments.mockResolvedValue([
      { id: 'd1', type: 'carte_pro', status: 'valid' },
      { id: 'd2', type: 'assurance', status: 'pending' },
    ])

    const { result } = renderHook(() => useDriverDocuments())
    await act(async () => {})

    expect(mockGetDocuments).toHaveBeenCalledWith('drv-1')
    expect(result.current.docs).toHaveLength(2)
    expect(result.current.loading).toBe(false)
  })

  it('ne charge rien si pas d\'utilisateur connecté', () => {
    mockUseAuth.mockReturnValue({ user: null } as ReturnType<typeof useAuth>)

    renderHook(() => useDriverDocuments())

    expect(mockGetDocuments).not.toHaveBeenCalled()
  })
})

// ─── validCount ───────────────────────────────────────────────────────────────
describe('useDriverDocuments — validCount', () => {
  it('compte uniquement les documents avec status "valid"', async () => {
    const user = { id: 'drv-2' }
    mockUseAuth.mockReturnValue({ user } as ReturnType<typeof useAuth>)
    mockGetDocuments.mockResolvedValue([
      { id: 'd1', type: 'carte_pro', status: 'valid' },
      { id: 'd2', type: 'assurance', status: 'valid' },
      { id: 'd3', type: 'ct', status: 'pending' },
      { id: 'd4', type: 'permis', status: 'invalid' },
    ])

    const { result } = renderHook(() => useDriverDocuments())
    await act(async () => {})

    expect(result.current.validCount).toBe(2)
  })

  it('retourne 0 si aucun document valide', async () => {
    const user = { id: 'drv-3' }
    mockUseAuth.mockReturnValue({ user } as ReturnType<typeof useAuth>)
    mockGetDocuments.mockResolvedValue([
      { id: 'd1', type: 'carte_pro', status: 'pending' },
    ])

    const { result } = renderHook(() => useDriverDocuments())
    await act(async () => {})

    expect(result.current.validCount).toBe(0)
  })
})
