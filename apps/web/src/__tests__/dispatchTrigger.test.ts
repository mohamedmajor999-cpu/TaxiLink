import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { triggerDispatchMission } from '@/lib/dispatchTrigger'

describe('dispatchTrigger', () => {
  const fetchMock = vi.fn()
  const errorSpy  = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(console, 'error').mockImplementation(errorSpy)
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key'
    fetchMock.mockResolvedValue({ ok: true } as Response)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    errorSpy.mockReset()
    fetchMock.mockReset()
  })

  it('fire fetch vers /functions/v1/dispatch_mission avec service-role key', () => {
    const inOneHour = new Date(Date.now() + 3_600_000).toISOString()
    triggerDispatchMission('mission-abc', inOneHour)

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe('https://test.supabase.co/functions/v1/dispatch_mission')
    expect(opts.method).toBe('POST')
    expect(opts.headers).toMatchObject({
      Authorization: 'Bearer service-role-test-key',
      'Content-Type': 'application/json',
    })
    expect(JSON.parse(opts.body)).toEqual({ mission_id: 'mission-abc' })
  })

  it('skip si horizon > 24h (laisse marketplace planifiée legacy gérer)', () => {
    const inTwoDays = new Date(Date.now() + 48 * 3_600_000).toISOString()
    triggerDispatchMission('mission-future', inTwoDays)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('skip + log si SUPABASE_SERVICE_ROLE_KEY manquant', () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    triggerDispatchMission('mission-x', new Date().toISOString())
    expect(fetchMock).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('manquant'))
  })

  it("ne throw pas si fetch échoue (best-effort, log seulement)", async () => {
    fetchMock.mockRejectedValue(new Error('network down'))
    expect(() => triggerDispatchMission('mission-y', new Date().toISOString())).not.toThrow()
    // Laisse la microtask de catch s'exécuter
    await new Promise((r) => setImmediate(r))
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('fire-and-forget failed'),
      expect.any(Error)
    )
  })
})
