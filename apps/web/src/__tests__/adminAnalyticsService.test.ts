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

  it('getMissionStats appelle GET /api/admin/missions-stats', async () => {
    const fixture = { daily: [], weekly: [], monthly: [], totals: { posted: 0, accepted: 0, completed: 0, totalAmount: 0, averageAmount: 0, acceptanceRate: 0 } }
    mockedApi.get.mockResolvedValue(fixture)
    const result = await adminAnalyticsService.getMissionStats()
    expect(mockedApi.get).toHaveBeenCalledWith('/api/admin/missions-stats')
    expect(result).toEqual(fixture)
  })

  it('getUserStats appelle GET /api/admin/users-stats', async () => {
    const fixture = {
      counters: { totalUsers: 0, totalDrivers: 0, totalClients: 0, newDrivers30d: 0, newClients30d: 0, onlineDrivers: 0, totalLogins90d: 0 },
      daily: [], weekly: [], monthly: [],
    }
    mockedApi.get.mockResolvedValue(fixture)
    await adminAnalyticsService.getUserStats()
    expect(mockedApi.get).toHaveBeenCalledWith('/api/admin/users-stats')
  })

  it('getTopDrivers appelle GET /api/admin/top-drivers', async () => {
    mockedApi.get.mockResolvedValue({ items: [] })
    await adminAnalyticsService.getTopDrivers()
    expect(mockedApi.get).toHaveBeenCalledWith('/api/admin/top-drivers')
  })

  it('getTopGroups appelle GET /api/admin/top-groups', async () => {
    mockedApi.get.mockResolvedValue({ items: [], counters: { totalGroups: 0, activeGroups30d: 0, totalMembers: 0 } })
    await adminAnalyticsService.getTopGroups()
    expect(mockedApi.get).toHaveBeenCalledWith('/api/admin/top-groups')
  })

  it('getOnlineDrivers appelle GET /api/admin/online-drivers', async () => {
    mockedApi.get.mockResolvedValue({ items: [] })
    await adminAnalyticsService.getOnlineDrivers()
    expect(mockedApi.get).toHaveBeenCalledWith('/api/admin/online-drivers')
  })
})
