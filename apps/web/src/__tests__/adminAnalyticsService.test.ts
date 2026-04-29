import { describe, it, expect, vi, beforeEach } from 'vitest'
import { adminAnalyticsService } from '@/services/adminAnalyticsService'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  ApiRequestError: class extends Error {},
}))

const mockedApi = api as unknown as {
  get:    ReturnType<typeof vi.fn>
  post:   ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}

beforeEach(() => {
  mockedApi.get.mockReset()
  mockedApi.post.mockReset()
  mockedApi.delete.mockReset()
})

describe('adminAnalyticsService', () => {
  it('getAiUsage appelle GET /api/admin/ai-usage', async () => {
    const fixture = { daily: [], weekly: [], monthly: [], topUsers: [], totals: { requests: 0, costUsd: 0, inputTokens: 0, outputTokens: 0 } }
    mockedApi.get.mockResolvedValue(fixture)
    const result = await adminAnalyticsService.getAiUsage()
    expect(mockedApi.get).toHaveBeenCalledWith('/api/admin/ai-usage')
    expect(result).toEqual(fixture)
  })

  it('listGoogleCosts appelle GET /api/admin/google-costs', async () => {
    mockedApi.get.mockResolvedValue({ items: [] })
    await adminAnalyticsService.listGoogleCosts()
    expect(mockedApi.get).toHaveBeenCalledWith('/api/admin/google-costs')
  })

  it('upsertGoogleCost POST avec le bon body', async () => {
    mockedApi.post.mockResolvedValue({ item: { id: 1 } })
    await adminAnalyticsService.upsertGoogleCost({ periodMonth: '2026-04', service: 'places', costUsd: 12.5 })
    expect(mockedApi.post).toHaveBeenCalledWith('/api/admin/google-costs', { periodMonth: '2026-04', service: 'places', costUsd: 12.5 })
  })

  it('deleteGoogleCost DELETE avec id en query', async () => {
    mockedApi.delete.mockResolvedValue({ ok: true })
    await adminAnalyticsService.deleteGoogleCost(42)
    expect(mockedApi.delete).toHaveBeenCalledWith('/api/admin/google-costs?id=42')
  })
})
