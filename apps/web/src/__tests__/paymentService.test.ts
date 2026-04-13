import { describe, it, expect, vi, beforeEach } from 'vitest'
import { paymentService } from '@/services/paymentService'

// ─── Mock Supabase ─────────────────────────────────────────────────────────────
const { mockFrom, mockSelect, mockUpdate, mockEq, mockEq2, mockOrder } = vi.hoisted(() => ({
  mockFrom:   vi.fn(),
  mockSelect: vi.fn(),
  mockUpdate: vi.fn(),
  mockEq:     vi.fn(),
  mockEq2:    vi.fn(),
  mockOrder:  vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockOrder.mockResolvedValue({ data: [], error: null })
  mockEq2.mockResolvedValue({ error: null })
  mockEq.mockReturnValue({ eq: mockEq2, order: mockOrder })
  mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder })
  mockUpdate.mockReturnValue({ eq: mockEq })
  mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate })
})

// ─── getPayments ──────────────────────────────────────────────────────────────
describe('paymentService.getPayments', () => {
  it('retourne les paiements du chauffeur', async () => {
    const fakePayments = [{ id: 'p1', driver_id: 'd1', amount: 150, status: 'pending' }]
    mockOrder.mockResolvedValue({ data: fakePayments, error: null })
    const result = await paymentService.getPayments('d1')
    expect(result).toEqual(fakePayments)
    expect(mockFrom).toHaveBeenCalledWith('payments')
  })

  it('retourne un tableau vide si data est null', async () => {
    mockOrder.mockResolvedValue({ data: null, error: null })
    const result = await paymentService.getPayments('d1')
    expect(result).toEqual([])
  })

  it('leve une erreur si Supabase echoue', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    await expect(paymentService.getPayments('d1')).rejects.toThrow('DB error')
  })
})

// ─── updateIBAN ───────────────────────────────────────────────────────────────
describe('paymentService.updateIBAN', () => {
  it('met a jour l IBAN sans erreur', async () => {
    mockEq2.mockResolvedValue({ error: null })
    await expect(paymentService.updateIBAN('d1', 'FR7614508059471234567890185')).resolves.toBeUndefined()
    expect(mockUpdate).toHaveBeenCalledWith({ iban: 'FR7614508059471234567890185' })
  })

  it('leve une erreur si Supabase echoue', async () => {
    mockEq2.mockResolvedValue({ error: { message: 'IBAN invalide' } })
    await expect(paymentService.updateIBAN('d1', 'MAUVAIS')).rejects.toThrow('IBAN invalide')
  })
})
