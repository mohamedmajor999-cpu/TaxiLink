import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const mockSubscribe = vi.fn()
const mockRemoveChannel = vi.fn()

type OnCall = [string, Record<string, unknown>, (payload: { new: unknown }) => void]
let onCalls: OnCall[] = []

const mockChannel = {
  on: vi.fn(),
  subscribe: mockSubscribe,
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    channel: vi.fn(() => mockChannel),
    removeChannel: mockRemoveChannel,
  })),
}))

import { useMissionRealtime } from '@/hooks/useMissionRealtime'

beforeEach(() => {
  vi.clearAllMocks()
  onCalls = []
  mockChannel.on.mockImplementation(
    (_type: string, filter: Record<string, unknown>, cb: (payload: { new: unknown }) => void) => {
      onCalls.push([_type, filter, cb])
      return mockChannel
    }
  )
})

describe('useMissionRealtime — souscription', () => {
  it('souscrit au channel au montage', () => {
    renderHook(() => useMissionRealtime({}))
    expect(mockSubscribe).toHaveBeenCalled()
  })

  it('configure 2 listeners (INSERT + UPDATE)', () => {
    renderHook(() => useMissionRealtime({}))
    expect(onCalls).toHaveLength(2)
  })

  it('le premier listener cible les INSERT AVAILABLE', () => {
    renderHook(() => useMissionRealtime({}))
    const [, filter] = onCalls[0]
    expect(filter.event).toBe('INSERT')
  })

  it('le second listener cible les UPDATE', () => {
    renderHook(() => useMissionRealtime({}))
    const [, filter] = onCalls[1]
    expect(filter.event).toBe('UPDATE')
  })

  it('appelle removeChannel au démontage', () => {
    const { unmount } = renderHook(() => useMissionRealtime({}))
    unmount()
    expect(mockRemoveChannel).toHaveBeenCalled()
  })
})

describe('useMissionRealtime — callbacks', () => {
  it('appelle onInsert lors d\'un événement INSERT', () => {
    const onInsert = vi.fn()
    renderHook(() => useMissionRealtime({ onInsert }))
    const insertCb = onCalls.find(([, f]) => f.event === 'INSERT')?.[2]
    const mission = { id: 'm1', status: 'AVAILABLE' }
    insertCb?.({ new: mission })
    expect(onInsert).toHaveBeenCalledWith(mission)
  })

  it('appelle onUpdate lors d\'un événement UPDATE', () => {
    const onUpdate = vi.fn()
    renderHook(() => useMissionRealtime({ onUpdate }))
    const updateCb = onCalls.find(([, f]) => f.event === 'UPDATE')?.[2]
    const mission = { id: 'm2', status: 'IN_PROGRESS' }
    updateCb?.({ new: mission })
    expect(onUpdate).toHaveBeenCalledWith(mission)
  })

  it('ne plante pas si onInsert n\'est pas fourni', () => {
    renderHook(() => useMissionRealtime({ onUpdate: vi.fn() }))
    const insertCb = onCalls.find(([, f]) => f.event === 'INSERT')?.[2]
    expect(() => insertCb?.({ new: { id: 'm3' } })).not.toThrow()
  })
})
