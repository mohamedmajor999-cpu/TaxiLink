import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { usePaiementsModal } from './usePaiementsModal'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const { mockGetPayments, mockUser } = vi.hoisted(() => ({
  mockGetPayments: vi.fn(),
  mockUser: { id: 'drv-1' },
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}))

vi.mock('@/services/paymentService', () => ({
  paymentService: { getPayments: mockGetPayments },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

function makePayment(overrides: {
  id: string
  amount_eur: number
  created_at: string
  iban?: string
}) {
  return {
    id: overrides.id,
    driver_id: 'drv-1',
    amount_eur: overrides.amount_eur,
    created_at: overrides.created_at,
    iban: overrides.iban ?? 'FR76 1234 5678',
    status: 'PAID',
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('usePaiementsModal', () => {
  it('démarre en état loading', () => {
    mockGetPayments.mockResolvedValue([])
    const { result } = renderHook(() => usePaiementsModal())
    expect(result.current.loading).toBe(true)
  })

  it('charge les paiements depuis getPayments', async () => {
    mockGetPayments.mockResolvedValue([makePayment({ id: 'p1', amount_eur: 50, created_at: new Date().toISOString() })])
    const { result } = renderHook(() => usePaiementsModal())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.payments).toHaveLength(1)
    expect(mockGetPayments).toHaveBeenCalledWith('drv-1')
  })

  it('calcule thisMonth avec les paiements du mois courant', async () => {
    const now = new Date()
    const thisMonthDate = now.toISOString()
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString()

    mockGetPayments.mockResolvedValue([
      makePayment({ id: 'p1', amount_eur: 100, created_at: thisMonthDate }),
      makePayment({ id: 'p2', amount_eur: 50, created_at: thisMonthDate }),
      makePayment({ id: 'p3', amount_eur: 200, created_at: lastMonthDate }),
    ])
    const { result } = renderHook(() => usePaiementsModal())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.thisMonth).toBe(150)
  })

  it('calcule today avec les paiements du jour', async () => {
    const todayDate = new Date().toISOString()
    const yesterdayDate = new Date(Date.now() - 86400000).toISOString()

    mockGetPayments.mockResolvedValue([
      makePayment({ id: 'p1', amount_eur: 40, created_at: todayDate }),
      makePayment({ id: 'p2', amount_eur: 60, created_at: todayDate }),
      makePayment({ id: 'p3', amount_eur: 100, created_at: yesterdayDate }),
    ])
    const { result } = renderHook(() => usePaiementsModal())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.today).toBe(100)
  })

  it('retourne 0 si aucun paiement', async () => {
    mockGetPayments.mockResolvedValue([])
    const { result } = renderHook(() => usePaiementsModal())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.thisMonth).toBe(0)
    expect(result.current.today).toBe(0)
  })

  it('set error si getPayments échoue', async () => {
    mockGetPayments.mockRejectedValue(new Error('Timeout'))
    const { result } = renderHook(() => usePaiementsModal())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Timeout')
  })
})
