import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAgendaTab } from '@/components/dashboard/driver/courses/useAgendaTab'
import { useDriverAgendaStore } from '@/store/driverAgendaStore'
import type { Mission } from '@/lib/supabase/types'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}))

import { useAuth } from '@/hooks/useAuth'
const mockUseAuth = vi.mocked(useAuth)

const FROZEN = new Date('2026-05-01T10:00:00.000Z')

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(FROZEN)
  vi.clearAllMocks()
  mockUseAuth.mockReturnValue({ user: { id: 'u1' }, loading: false } as ReturnType<typeof useAuth>)
  useDriverAgendaStore.setState({
    missions: [],
    isLoading: false,
    loadedFor: 'u1',
    error: null,
  })
})

afterEach(() => {
  vi.useRealTimers()
})

function seed(missions: Mission[]) {
  useDriverAgendaStore.setState({ missions, loadedFor: 'u1', isLoading: false, error: null })
}

function makeMission(id: string, scheduled_at: string, opts: Partial<Mission> = {}): Mission {
  return {
    id, scheduled_at,
    status: 'DONE',
    type: 'PRIVE',
    departure: 'Paris', destination: 'Lyon',
    price_eur: 0, distance_km: 10, duration_min: 30,
    shared_by: 'u1',
    driver_id: 'drv-1',
    ...opts,
  } as unknown as Mission
}

describe('useAgendaTab — états du store', () => {
  it('loading=true tant que le store n\'a pas été chargé', () => {
    useDriverAgendaStore.setState({ missions: [], loadedFor: null, isLoading: true, error: null })
    const { result } = renderHook(() => useAgendaTab())
    expect(result.current.loading).toBe(true)
  })

  it('error remonté depuis le store', () => {
    useDriverAgendaStore.setState({ missions: [], loadedFor: null, isLoading: false, error: 'réseau KO' })
    const { result } = renderHook(() => useAgendaTab())
    expect(result.current.error).toBe('réseau KO')
  })
})

describe('useAgendaTab — weekDays', () => {
  it('expose 7 jours pour la semaine courante', () => {
    const { result } = renderHook(() => useAgendaTab())
    expect(result.current.weekDays).toHaveLength(7)
  })

  it('la semaine commence par lundi (LUN) et finit par dimanche (DIM)', () => {
    const { result } = renderHook(() => useAgendaTab())
    expect(result.current.weekDays[0].dayShort).toBe('LUN')
    expect(result.current.weekDays[6].dayShort).toBe('DIM')
  })

  it('weekRangeLabel commence par "Semaine du"', () => {
    const { result } = renderHook(() => useAgendaTab())
    expect(result.current.weekRangeLabel.startsWith('Semaine du ')).toBe(true)
  })
})

describe('useAgendaTab — events', () => {
  it('events filtre les missions du jour sélectionné', () => {
    seed([
      makeMission('m1', '2026-05-01T11:00:00.000Z'),
      makeMission('m2', '2026-05-02T09:00:00.000Z'),
    ])
    const { result } = renderHook(() => useAgendaTab())
    expect(result.current.events).toHaveLength(1)
    expect(result.current.events[0].id).toBe('m1')
  })

  it('stats.count = nombre de events du jour', () => {
    seed([
      makeMission('m1', '2026-05-01T09:00:00.000Z', { price_eur: 30 }),
      makeMission('m2', '2026-05-01T14:00:00.000Z', { price_eur: 50 }),
    ])
    const { result } = renderHook(() => useAgendaTab())
    expect(result.current.stats.count).toBe(2)
    expect(result.current.stats.total).toBe(80)
  })
})

describe('useAgendaTab — addMission', () => {
  it('addMission insère la mission dans le store et change le jour sélectionné', () => {
    const { result } = renderHook(() => useAgendaTab())
    const newMission = makeMission('m-new', '2026-05-03T09:00:00.000Z', { status: 'ACCEPTED' })
    act(() => { result.current.addMission(newMission) })
    expect(result.current.selected.toDateString()).toBe(new Date('2026-05-03').toDateString())
    expect(useDriverAgendaStore.getState().missions.some((m) => m.id === 'm-new')).toBe(true)
  })
})

describe('useAgendaTab — daysGroups', () => {
  it('expose 16 jours futurs à partir d\'aujourd\'hui (J → J+15)', () => {
    const { result } = renderHook(() => useAgendaTab())
    expect(result.current.daysGroups).toHaveLength(16)
  })

  it('le 1er groupe correspond à aujourd\'hui avec label commençant par "Aujourd\'hui"', () => {
    const { result } = renderHook(() => useAgendaTab())
    expect(result.current.daysGroups[0].date.toDateString()).toBe(FROZEN.toDateString())
    expect(result.current.daysGroups[0].label.startsWith("Aujourd'hui")).toBe(true)
  })

  it('le 2e groupe correspond à demain avec label commençant par "Demain"', () => {
    const { result } = renderHook(() => useAgendaTab())
    expect(result.current.daysGroups[1].label.startsWith('Demain')).toBe(true)
  })

  it('chaque groupe expose count + total = somme des price_eur des events du jour', () => {
    seed([
      makeMission('m1', '2026-05-01T09:00:00.000Z', { price_eur: 30 }),
      makeMission('m2', '2026-05-01T14:00:00.000Z', { price_eur: 50 }),
      makeMission('m3', '2026-05-03T10:00:00.000Z', { price_eur: 25 }),
    ])
    const { result } = renderHook(() => useAgendaTab())
    const today = result.current.daysGroups[0]
    const dayPlus2 = result.current.daysGroups[2]
    expect(today.count).toBe(2)
    expect(today.total).toBe(80)
    expect(dayPlus2.count).toBe(1)
    expect(dayPlus2.total).toBe(25)
  })

  it('les jours vides existent et ont count=0', () => {
    const { result } = renderHook(() => useAgendaTab())
    expect(result.current.daysGroups.every((g) => g.count === 0)).toBe(true)
  })
})

describe('useAgendaTab — navigation hebdo', () => {
  it('today / maxDate délimitent une fenêtre de 16 jours', () => {
    const { result } = renderHook(() => useAgendaTab())
    const days = (result.current.maxDate.getTime() - result.current.today.getTime()) / 86_400_000
    expect(Math.round(days)).toBe(15)
  })

  it("canPrevWeek=false sur la semaine d'aujourd'hui", () => {
    const { result } = renderHook(() => useAgendaTab())
    expect(result.current.canPrevWeek).toBe(false)
  })

  it('canNextWeek=true tant que la semaine suivante chevauche la fenêtre', () => {
    const { result } = renderHook(() => useAgendaTab())
    expect(result.current.canNextWeek).toBe(true)
  })

  it('removeMission retire la mission du store partagé', () => {
    seed([makeMission('m1', '2026-05-03T09:00:00.000Z', { status: 'ACCEPTED' })])
    const { result } = renderHook(() => useAgendaTab())
    act(() => { result.current.removeMission('m1') })
    expect(useDriverAgendaStore.getState().missions.length).toBe(0)
  })
})

describe('useAgendaTab — openAddModalFor / closeAddModal', () => {
  it('openAddModalFor positionne addModalDate et ouvre showAddModal', () => {
    const { result } = renderHook(() => useAgendaTab())
    const target = new Date('2026-05-05')
    act(() => { result.current.openAddModalFor(target) })
    expect(result.current.showAddModal).toBe(true)
    expect(result.current.addModalDate?.toDateString()).toBe(target.toDateString())
  })

  it('closeAddModal réinitialise addModalDate et ferme la modal', () => {
    const { result } = renderHook(() => useAgendaTab())
    act(() => { result.current.openAddModalFor(new Date('2026-05-05')) })
    expect(result.current.showAddModal).toBe(true)
    act(() => { result.current.closeAddModal() })
    expect(result.current.showAddModal).toBe(false)
    expect(result.current.addModalDate).toBeNull()
  })
})
