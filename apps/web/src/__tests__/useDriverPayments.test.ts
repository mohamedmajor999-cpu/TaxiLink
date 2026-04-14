import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useDriverPayments } from '@/components/dashboard/driver/useDriverPayments'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockGetPayments = vi.fn()
const mockUpdateIBAN  = vi.fn()

// Référence stable — évite la boucle infinie causée par useEffect([user])
const mockUser = { id: 'u1' }

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}))

vi.mock('@/services/paymentService', () => ({
  paymentService: {
    getPayments: (...a: unknown[]) => mockGetPayments(...a),
    updateIBAN:  (...a: unknown[]) => mockUpdateIBAN(...a),
  },
}))

const fakePayments = [
  { id: 'p1', amount_eur: 30, status: 'paid',    iban: 'FR76000' },
  { id: 'p2', amount_eur: 20, status: 'pending', iban: null      },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockGetPayments.mockResolvedValue(fakePayments)
  mockUpdateIBAN.mockResolvedValue(undefined)
})

// ─── Chargement ───────────────────────────────────────────────────────────────
describe('useDriverPayments — chargement', () => {
  it('charge les paiements et calcule totalPaid et totalPending', async () => {
    const { result } = renderHook(() => useDriverPayments())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.payments).toHaveLength(2)
    expect(result.current.totalPaid).toBe(30)
    expect(result.current.totalPending).toBe(20)
    expect(result.current.iban).toBe('FR76000')
  })
})

// ─── Sauvegarde IBAN ──────────────────────────────────────────────────────────
describe('useDriverPayments — handleSaveIban', () => {
  it('appelle updateIBAN et passe ibanSaved a true', async () => {
    const { result } = renderHook(() => useDriverPayments())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => { await result.current.handleSaveIban() })

    expect(mockUpdateIBAN).toHaveBeenCalledWith('u1', 'FR76000')
    expect(result.current.ibanSaved).toBe(true)
    expect(result.current.savedIban).toBe('FR76000')
  })
})
