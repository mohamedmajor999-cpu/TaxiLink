import { describe, it, expect, vi, beforeEach } from 'vitest'
import { missionViewsService } from '@/services/missionViewsService'

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('missionViewsService.record', () => {
  it('insert (mission_id, viewer_id) sur mission_views', async () => {
    const insertSpy = vi.fn().mockReturnValue({
      then: (resolve: () => unknown) => Promise.resolve().then(resolve),
    })
    mockFrom.mockReturnValue({ insert: insertSpy })
    await missionViewsService.record('m-1', 'u-1')
    expect(mockFrom).toHaveBeenCalledWith('mission_views')
    expect(insertSpy).toHaveBeenCalledWith({ mission_id: 'm-1', viewer_id: 'u-1' })
  })

  it('avale silencieusement les erreurs (best-effort, ne doit pas bloquer l UX)', async () => {
    const insertSpy = vi.fn().mockReturnValue({
      then: (_resolve: () => unknown, reject: (err: unknown) => unknown) =>
        Promise.reject(new Error('UNIQUE violation')).catch((err) => reject(err)),
    })
    mockFrom.mockReturnValue({ insert: insertSpy })
    await expect(missionViewsService.record('m-1', 'u-1')).resolves.toBeUndefined()
  })
})
