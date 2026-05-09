import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { useEffect } from 'react'
import { MissionRealtimeProvider, useMissionRealtimeContext } from '@/components/realtime/MissionRealtimeProvider'

const mockSubscribe = vi.fn()
const mockRemoveChannel = vi.fn()

type OnCall = [string, Record<string, unknown>, (payload: unknown) => void]
let onCalls: OnCall[]

const makeChannel = () => {
  const channel = { on: vi.fn(), subscribe: mockSubscribe }
  channel.on.mockImplementation((type: string, filter: Record<string, unknown>, cb: (p: unknown) => void) => {
    onCalls.push([type, filter, cb])
    return channel
  })
  channel.subscribe.mockReturnValue(channel)
  return channel
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    channel: vi.fn(() => makeChannel()),
    removeChannel: mockRemoveChannel,
  })),
}))

beforeEach(() => {
  vi.clearAllMocks()
  onCalls = []
})

describe('MissionRealtimeProvider', () => {
  it('ouvre exactement 2 channels Supabase au montage (missions + mission-events)', () => {
    render(<MissionRealtimeProvider><span /></MissionRealtimeProvider>)
    expect(mockSubscribe).toHaveBeenCalledTimes(2)
  })

  it('configure 4 listeners (INSERT + UPDATE + DELETE sur missions + accepted sur mission-events)', () => {
    render(<MissionRealtimeProvider><span /></MissionRealtimeProvider>)
    expect(onCalls).toHaveLength(4)
    expect(onCalls[0][1]).toMatchObject({ event: 'INSERT' })
    expect(onCalls[1][1]).toMatchObject({ event: 'UPDATE' })
    expect(onCalls[2][1]).toMatchObject({ event: 'DELETE' })
    expect(onCalls[3]).toEqual(['broadcast', { event: 'accepted' }, expect.any(Function)])
  })

  it('removeChannel x2 au demontage', () => {
    const { unmount } = render(<MissionRealtimeProvider><span /></MissionRealtimeProvider>)
    unmount()
    expect(mockRemoveChannel).toHaveBeenCalledTimes(2)
  })

  it('diffuse INSERT (status AVAILABLE) avec PII null aux abonnes via le context', () => {
    const onInsert = vi.fn()
    function Sub() {
      const subscribe = useMissionRealtimeContext()!
      useEffect(() => subscribe({ onInsert }), [subscribe])
      return null
    }
    render(<MissionRealtimeProvider><Sub /></MissionRealtimeProvider>)
    const insertCb = onCalls.find(([, f]) => f.event === 'INSERT')![2]
    act(() => insertCb({ payload: { id: 'm1', status: 'AVAILABLE', patient_name: 'leak?' } }))
    expect(onInsert).toHaveBeenCalledWith(expect.objectContaining({
      id: 'm1', status: 'AVAILABLE', patient_name: null, phone: null, notes: null,
    }))
  })

  it('ignore INSERT non-AVAILABLE (filtre cote provider)', () => {
    const onInsert = vi.fn()
    function Sub() {
      const subscribe = useMissionRealtimeContext()!
      useEffect(() => subscribe({ onInsert }), [subscribe])
      return null
    }
    render(<MissionRealtimeProvider><Sub /></MissionRealtimeProvider>)
    const insertCb = onCalls.find(([, f]) => f.event === 'INSERT')![2]
    act(() => insertCb({ payload: { id: 'm1', status: 'IN_PROGRESS' } }))
    expect(onInsert).not.toHaveBeenCalled()
  })

  it('diffuse UPDATE et DELETE a tous les abonnes', () => {
    const onUpdate1 = vi.fn(), onUpdate2 = vi.fn(), onDelete = vi.fn()
    function Sub1() {
      const s = useMissionRealtimeContext()!
      useEffect(() => s({ onUpdate: onUpdate1, onDelete }), [s])
      return null
    }
    function Sub2() {
      const s = useMissionRealtimeContext()!
      useEffect(() => s({ onUpdate: onUpdate2 }), [s])
      return null
    }
    render(<MissionRealtimeProvider><Sub1 /><Sub2 /></MissionRealtimeProvider>)
    const updateCb = onCalls.find(([, f]) => f.event === 'UPDATE')![2]
    const deleteCb = onCalls.find(([, f]) => f.event === 'DELETE')![2]
    act(() => updateCb({ payload: { id: 'm9', status: 'IN_PROGRESS' } }))
    act(() => deleteCb({ payload: { id: 'm9' } }))
    expect(onUpdate1).toHaveBeenCalled()
    expect(onUpdate2).toHaveBeenCalled()
    expect(onDelete).toHaveBeenCalledWith({ id: 'm9' })
  })

  it('event accepted (canal mission-events) declenche onDelete', () => {
    const onDelete = vi.fn()
    function Sub() {
      const s = useMissionRealtimeContext()!
      useEffect(() => s({ onDelete }), [s])
      return null
    }
    render(<MissionRealtimeProvider><Sub /></MissionRealtimeProvider>)
    const acceptedCb = onCalls.find(([type, f]) => type === 'broadcast' && f.event === 'accepted')![2]
    act(() => acceptedCb({ payload: { id: 'm-accepted' } }))
    expect(onDelete).toHaveBeenCalledWith({ id: 'm-accepted' })
  })

  it('subscribe retourne un unsubscribe qui retire l abonnement', () => {
    const onInsert = vi.fn()
    function Sub() {
      const s = useMissionRealtimeContext()!
      useEffect(() => {
        const off = s({ onInsert })
        off() // immediat
      }, [s])
      return null
    }
    render(<MissionRealtimeProvider><Sub /></MissionRealtimeProvider>)
    const insertCb = onCalls.find(([, f]) => f.event === 'INSERT')![2]
    act(() => insertCb({ payload: { id: 'm', status: 'AVAILABLE' } }))
    expect(onInsert).not.toHaveBeenCalled()
  })
})
