import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { useMissionRealtime } from '@/hooks/useMissionRealtime'

// Le hook utilise un context fourni par MissionRealtimeProvider. Pour le tester
// en isolation on stub le context avec un Provider de test qui expose un
// `subscribe` minimal et permet de declencher manuellement les callbacks.

import { useMissionRealtimeContext } from '@/components/realtime/MissionRealtimeProvider'

vi.mock('@/components/realtime/MissionRealtimeProvider', async () => {
  const actual = await vi.importActual<typeof import('@/components/realtime/MissionRealtimeProvider')>(
    '@/components/realtime/MissionRealtimeProvider'
  )
  return { ...actual, useMissionRealtimeContext: vi.fn() }
})

const mockedContextHook = useMissionRealtimeContext as unknown as ReturnType<typeof vi.fn>

function makeSubscribe() {
  type CB = { onInsert?: (m: unknown) => void; onUpdate?: (m: unknown) => void; onDelete?: (m: unknown) => void }
  const subs = new Set<CB>()
  const subscribe = vi.fn((cb: CB) => {
    subs.add(cb)
    return () => { subs.delete(cb) }
  })
  return { subscribe, fire: { insert: (m: unknown) => subs.forEach((s) => s.onInsert?.(m)), update: (m: unknown) => subs.forEach((s) => s.onUpdate?.(m)), delete: (m: unknown) => subs.forEach((s) => s.onDelete?.(m)) }, size: () => subs.size }
}

describe('useMissionRealtime — souscription au provider', () => {
  it('appelle subscribe() une fois au montage', () => {
    const { subscribe } = makeSubscribe()
    mockedContextHook.mockReturnValue(subscribe)
    renderHook(() => useMissionRealtime({}))
    expect(subscribe).toHaveBeenCalledTimes(1)
  })

  it('cleanup se desabonne au demontage', () => {
    const { subscribe, size } = makeSubscribe()
    mockedContextHook.mockReturnValue(subscribe)
    const { unmount } = renderHook(() => useMissionRealtime({}))
    expect(size()).toBe(1)
    unmount()
    expect(size()).toBe(0)
  })

  it('no-op si pas de provider monté (subscribe = null)', () => {
    mockedContextHook.mockReturnValue(null)
    expect(() => renderHook(() => useMissionRealtime({ onInsert: vi.fn() }))).not.toThrow()
  })
})

describe('useMissionRealtime — callbacks deleguees', () => {
  it('onInsert recoit l objet mission diffuse par le provider', () => {
    const { subscribe, fire } = makeSubscribe()
    mockedContextHook.mockReturnValue(subscribe)
    const onInsert = vi.fn()
    renderHook(() => useMissionRealtime({ onInsert }))
    fire.insert({ id: 'm1', status: 'AVAILABLE' })
    expect(onInsert).toHaveBeenCalledWith({ id: 'm1', status: 'AVAILABLE' })
  })

  it('onUpdate idem', () => {
    const { subscribe, fire } = makeSubscribe()
    mockedContextHook.mockReturnValue(subscribe)
    const onUpdate = vi.fn()
    renderHook(() => useMissionRealtime({ onUpdate }))
    fire.update({ id: 'm2', status: 'IN_PROGRESS' })
    expect(onUpdate).toHaveBeenCalledWith({ id: 'm2', status: 'IN_PROGRESS' })
  })

  it('onDelete idem', () => {
    const { subscribe, fire } = makeSubscribe()
    mockedContextHook.mockReturnValue(subscribe)
    const onDelete = vi.fn()
    renderHook(() => useMissionRealtime({ onDelete }))
    fire.delete({ id: 'm3' })
    expect(onDelete).toHaveBeenCalledWith({ id: 'm3' })
  })

  it('un consommateur sans onInsert ne plante pas si event INSERT survient', () => {
    const { subscribe, fire } = makeSubscribe()
    mockedContextHook.mockReturnValue(subscribe)
    renderHook(() => useMissionRealtime({ onUpdate: vi.fn() }))
    expect(() => fire.insert({ id: 'm4', status: 'AVAILABLE' })).not.toThrow()
  })

  it('plusieurs hooks consommateurs partagent le meme provider (1 abonnement chacun)', () => {
    const { subscribe } = makeSubscribe()
    mockedContextHook.mockReturnValue(subscribe)
    const wrapper = ({ children }: { children: ReactNode }) => createElement('div', null, children)
    renderHook(() => useMissionRealtime({ onInsert: vi.fn() }), { wrapper })
    renderHook(() => useMissionRealtime({ onUpdate: vi.fn() }), { wrapper })
    expect(subscribe).toHaveBeenCalledTimes(2)
  })
})
