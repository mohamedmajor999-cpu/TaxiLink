import { describe, it, expect, vi, beforeEach } from 'vitest'
import { adminModerationService } from '@/services/adminModerationService'

const { mockPost } = vi.hoisted(() => ({ mockPost: vi.fn() }))

vi.mock('@/lib/api', () => ({
  api: { post: mockPost, get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('adminModerationService.deleteUserByEmail', () => {
  it('POST /api/admin/users/delete-by-email avec l email et retourne le payload', async () => {
    mockPost.mockResolvedValue({ ok: true, deleted_email: 'spam@x.com', deleted_user_id: 'u-1' })
    const result = await adminModerationService.deleteUserByEmail('spam@x.com')
    expect(mockPost).toHaveBeenCalledWith('/api/admin/users/delete-by-email', { email: 'spam@x.com' })
    expect(result).toEqual({ ok: true, deleted_email: 'spam@x.com', deleted_user_id: 'u-1' })
  })

  it('propage l erreur api (403 / 404 user inconnu / network)', async () => {
    mockPost.mockRejectedValue(new Error('Forbidden'))
    await expect(adminModerationService.deleteUserByEmail('x@y.com')).rejects.toThrow('Forbidden')
  })
})
