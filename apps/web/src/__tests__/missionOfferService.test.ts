import { describe, it, expect, vi, beforeEach } from 'vitest'
import { missionOfferService } from '@/services/missionOfferService'

const { mockFrom, mockRpc } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc:  vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom, rpc: mockRpc }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('missionOfferService.accept', () => {
  it('appelle le RPC accept_mission_offer avec p_offer_id', async () => {
    mockRpc.mockResolvedValue({ data: { success: true, mission_id: 'm-1' }, error: null })
    const res = await missionOfferService.accept('off-1')
    expect(mockRpc).toHaveBeenCalledWith('accept_mission_offer', { p_offer_id: 'off-1' })
    expect(res.success).toBe(true)
    expect(res.mission_id).toBe('m-1')
  })

  it('relaie un échec MISSION_TAKEN sans throw', async () => {
    mockRpc.mockResolvedValue({ data: { success: false, error: 'MISSION_TAKEN' }, error: null })
    const res = await missionOfferService.accept('off-1')
    expect(res.success).toBe(false)
    expect(res.error).toBe('MISSION_TAKEN')
  })

  it('throw si erreur Supabase', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RLS denied' } })
    await expect(missionOfferService.accept('off-1')).rejects.toThrow('RLS denied')
  })
})

describe('missionOfferService.refuse', () => {
  it('appelle le RPC refuse_mission_offer', async () => {
    mockRpc.mockResolvedValue({ data: { success: true }, error: null })
    const res = await missionOfferService.refuse('off-2')
    expect(mockRpc).toHaveBeenCalledWith('refuse_mission_offer', { p_offer_id: 'off-2' })
    expect(res.success).toBe(true)
  })
})

describe('missionOfferService.getPendingForDriver', () => {
  it('filtre status=PENDING + non expirées + unlock_at passé + driver_id', async () => {
    // Chaîne attendue : from.select.eq(driver_id).eq(status).gt(expires_at).lte(unlock_at).order(sent_at)
    const order  = vi.fn().mockResolvedValue({ data: [{ id: 'o1' }, { id: 'o2' }], error: null })
    const lte    = vi.fn().mockReturnValue({ order })
    const gt     = vi.fn().mockReturnValue({ lte })
    const eq2    = vi.fn().mockReturnValue({ gt })
    const eq1    = vi.fn().mockReturnValue({ eq: eq2 })
    const select = vi.fn().mockReturnValue({ eq: eq1 })
    mockFrom.mockReturnValue({ select })

    const result = await missionOfferService.getPendingForDriver('drv-1')

    expect(mockFrom).toHaveBeenCalledWith('mission_offers')
    expect(eq1).toHaveBeenCalledWith('driver_id', 'drv-1')
    expect(eq2).toHaveBeenCalledWith('status', 'PENDING')
    expect(gt).toHaveBeenCalledWith('expires_at', expect.any(String))
    expect(lte).toHaveBeenCalledWith('unlock_at', expect.any(String))
    expect(result).toEqual([{ id: 'o1' }, { id: 'o2' }])
  })
})
