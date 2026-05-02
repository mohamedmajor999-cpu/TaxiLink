import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAgendaTab } from '@/components/dashboard/driver/courses/useAgendaTab'
import type { Mission } from '@/lib/supabase/types'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockGetAgenda = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/services/missionService', () => ({
  missionService: {
    getAgenda: (...a: unknown[]) => mockGetAgenda(...a),
  },
}))

vi.mock('@/hooks/useMissionRealtime', () => ({
  useMissionRealtime: vi.fn(),
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
  mockGetAgenda.mockResolvedValue([])
})

afterEach(() => {
  vi.useRealTimers()
})

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

// ─── Chargement ───────────────────────────────────────────────────────────────
describe('useAgendaTab — chargement', () => {
  it('ne charge pas sans user', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false } as ReturnType<typeof useAuth>)
    renderHook(() => useAgendaTab())
    expect(mockGetAgenda).not.toHaveBeenCalled()
  })

  it('charge via getAgenda et passe loading à false', async () => {
    const { result } = renderHook(() => useAgendaTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(mockGetAgenda).toHaveBeenCalledWith('u1')
    expect(result.current.error).toBeNull()
  })

  it('met error si getAgenda échoue', async () => {
    mockGetAgenda.mockRejectedValueOnce(new Error('réseau'))
    const { result } = renderHook(() => useAgendaTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('réseau')
  })
})

// ─── Strip de la semaine ──────────────────────────────────────────────────────
describe('useAgendaTab — weekDays', () => {
  it('expose 7 jours pour la semaine courante', async () => {
    const { result } = renderHook(() => useAgendaTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.weekDays).toHaveLength(7)
  })

  it('la semaine commence par lundi (LUN) et finit par dimanche (DIM)', async () => {
    const { result } = renderHook(() => useAgendaTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.weekDays[0].dayShort).toBe('LUN')
    expect(result.current.weekDays[6].dayShort).toBe('DIM')
  })

  it('weekRangeLabel commence par "Semaine du"', async () => {
    const { result } = renderHook(() => useAgendaTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.weekRangeLabel.startsWith('Semaine du ')).toBe(true)
  })
})

// ─── Events du jour sélectionné ───────────────────────────────────────────────
describe('useAgendaTab — events', () => {
  it('events filtre les missions du jour sélectionné', async () => {
    mockGetAgenda.mockResolvedValueOnce([
      makeMission('m1', '2026-05-01T11:00:00.000Z'),
      makeMission('m2', '2026-05-02T09:00:00.000Z'),
    ])
    const { result } = renderHook(() => useAgendaTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.events).toHaveLength(1)
    expect(result.current.events[0].id).toBe('m1')
  })

  it('stats.count = nombre de events du jour', async () => {
    mockGetAgenda.mockResolvedValueOnce([
      makeMission('m1', '2026-05-01T09:00:00.000Z', { price_eur: 30 }),
      makeMission('m2', '2026-05-01T14:00:00.000Z', { price_eur: 50 }),
    ])
    const { result } = renderHook(() => useAgendaTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.stats.count).toBe(2)
    expect(result.current.stats.total).toBe(80)
  })
})

// ─── Ajout manuel ─────────────────────────────────────────────────────────────
describe('useAgendaTab — addMission', () => {
  it('addMission insère la mission dans le state et change le jour sélectionné', async () => {
    const { result } = renderHook(() => useAgendaTab())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const newMission = makeMission('m-new', '2026-05-03T09:00:00.000Z', { status: 'ACCEPTED' })
    result.current.addMission(newMission)

    await waitFor(() => {
      expect(result.current.selected.toDateString()).toBe(new Date('2026-05-03').toDateString())
    })
  })
})

// ─── Vue multi-jours (daysGroups) ─────────────────────────────────────────────
describe('useAgendaTab — daysGroups', () => {
  it('expose 16 jours futurs à partir d\'aujourd\'hui (J → J+15)', async () => {
    const { result } = renderHook(() => useAgendaTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.daysGroups).toHaveLength(16)
  })

  it('le 1er groupe correspond à aujourd\'hui avec label commençant par "Aujourd\'hui"', async () => {
    const { result } = renderHook(() => useAgendaTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.daysGroups[0].date.toDateString()).toBe(FROZEN.toDateString())
    expect(result.current.daysGroups[0].label.startsWith("Aujourd'hui")).toBe(true)
  })

  it('le 2e groupe correspond à demain avec label commençant par "Demain"', async () => {
    const { result } = renderHook(() => useAgendaTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.daysGroups[1].label.startsWith('Demain')).toBe(true)
  })

  it('chaque groupe expose count + total = somme des price_eur des events du jour', async () => {
    mockGetAgenda.mockResolvedValueOnce([
      makeMission('m1', '2026-05-01T09:00:00.000Z', { price_eur: 30 }),
      makeMission('m2', '2026-05-01T14:00:00.000Z', { price_eur: 50 }),
      makeMission('m3', '2026-05-03T10:00:00.000Z', { price_eur: 25 }),
    ])
    const { result } = renderHook(() => useAgendaTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    const today = result.current.daysGroups[0]
    const dayPlus2 = result.current.daysGroups[2]
    expect(today.count).toBe(2)
    expect(today.total).toBe(80)
    expect(dayPlus2.count).toBe(1)
    expect(dayPlus2.total).toBe(25)
  })

  it('les jours vides existent et ont count=0', async () => {
    const { result } = renderHook(() => useAgendaTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.daysGroups.every((g) => g.count === 0)).toBe(true)
  })
})

// ─── Navigation hebdo (J → J+15) ──────────────────────────────────────────────
describe('useAgendaTab — navigation hebdo', () => {
  it('today / maxDate délimitent une fenêtre de 16 jours', async () => {
    const { result } = renderHook(() => useAgendaTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    const days = (result.current.maxDate.getTime() - result.current.today.getTime()) / 86_400_000
    expect(Math.round(days)).toBe(15)
  })

  it("canPrevWeek=false sur la semaine d'aujourd'hui", async () => {
    const { result } = renderHook(() => useAgendaTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.canPrevWeek).toBe(false)
  })

  it('canNextWeek=true tant que la semaine suivante chevauche la fenêtre', async () => {
    const { result } = renderHook(() => useAgendaTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.canNextWeek).toBe(true)
  })

  it('removeMission retire la mission du state', async () => {
    mockGetAgenda.mockResolvedValueOnce([
      makeMission('m1', '2026-05-03T09:00:00.000Z', { status: 'ACCEPTED' }),
    ])
    const { result } = renderHook(() => useAgendaTab())
    await waitFor(() => expect(result.current.loading).toBe(false))
    result.current.removeMission('m1')
    await waitFor(() => expect(result.current.daysGroups[2].count).toBe(0))
  })
})

// ─── openAddModalFor ─────────────────────────────────────────────────────────
describe('useAgendaTab — openAddModalFor / closeAddModal', () => {
  it('openAddModalFor positionne addModalDate et ouvre showAddModal', async () => {
    const { result } = renderHook(() => useAgendaTab())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const target = new Date('2026-05-05')
    result.current.openAddModalFor(target)

    await waitFor(() => expect(result.current.showAddModal).toBe(true))
    expect(result.current.addModalDate?.toDateString()).toBe(target.toDateString())
  })

  it('closeAddModal réinitialise addModalDate et ferme la modal', async () => {
    const { result } = renderHook(() => useAgendaTab())
    await waitFor(() => expect(result.current.loading).toBe(false))

    result.current.openAddModalFor(new Date('2026-05-05'))
    await waitFor(() => expect(result.current.showAddModal).toBe(true))

    result.current.closeAddModal()
    await waitFor(() => expect(result.current.showAddModal).toBe(false))
    expect(result.current.addModalDate).toBeNull()
  })
})
