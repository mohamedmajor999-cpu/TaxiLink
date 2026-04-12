import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAgendaScreen } from './useAgendaScreen'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const { mockGetAgenda, mockUser } = vi.hoisted(() => ({
  mockGetAgenda: vi.fn(),
  mockUser: { id: 'drv-1' },
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}))

vi.mock('@/services/missionService', () => ({
  missionService: { getAgenda: mockGetAgenda },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

const today = new Date()
today.setHours(0, 0, 0, 0)

function makeMission(date: Date) {
  return {
    id: `m-${date.toISOString()}`,
    type: 'CPAM',
    status: 'AVAILABLE',
    departure: 'Paris',
    destination: 'Lyon',
    distance_km: 10,
    price_eur: 30,
    scheduled_at: date.toISOString(),
    driver_id: 'drv-1',
    patient_name: 'Jean',
    phone: null,
    client_id: null,
    created_at: date.toISOString(),
    accepted_at: null,
    completed_at: null,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('useAgendaScreen', () => {
  it('démarre en vue jour', () => {
    mockGetAgenda.mockResolvedValue([])
    const { result } = renderHook(() => useAgendaScreen())
    expect(result.current.view).toBe('jour')
  })

  it('charge les courses via getAgenda', async () => {
    const missionToday = makeMission(today)
    mockGetAgenda.mockResolvedValue([missionToday])
    const { result } = renderHook(() => useAgendaScreen())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(mockGetAgenda).toHaveBeenCalledWith('drv-1')
  })

  it('ridesForDay retourne les courses du jour sélectionné', async () => {
    const missionToday = makeMission(today)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const missionTomorrow = makeMission(tomorrow)

    mockGetAgenda.mockResolvedValue([missionToday, missionTomorrow])
    const { result } = renderHook(() => useAgendaScreen())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const todayRides = result.current.ridesForDay(today)
    expect(todayRides).toHaveLength(1)
    expect(todayRides[0].departure).toBe('Paris')
  })

  it('ridesForSelected retourne les courses du jour sélectionné par défaut (aujourd\'hui)', async () => {
    const missionToday = makeMission(today)
    mockGetAgenda.mockResolvedValue([missionToday])
    const { result } = renderHook(() => useAgendaScreen())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.ridesForSelected).toHaveLength(1)
  })

  it('prevDay recule d\'un jour', async () => {
    mockGetAgenda.mockResolvedValue([])
    const { result } = renderHook(() => useAgendaScreen())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const before = result.current.selectedDate.getDate()
    act(() => { result.current.prevDay() })
    expect(result.current.selectedDate.getDate()).toBe(before - 1)
  })

  it('nextDay avance d\'un jour', async () => {
    mockGetAgenda.mockResolvedValue([])
    const { result } = renderHook(() => useAgendaScreen())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const before = result.current.selectedDate.getDate()
    act(() => { result.current.nextDay() })
    expect(result.current.selectedDate.getDate()).toBe(before + 1)
  })

  it('weekDays contient 7 jours', async () => {
    mockGetAgenda.mockResolvedValue([])
    const { result } = renderHook(() => useAgendaScreen())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.weekDays).toHaveLength(7)
  })

  it('set error si getAgenda échoue', async () => {
    mockGetAgenda.mockRejectedValue(new Error('Pas de connexion'))
    const { result } = renderHook(() => useAgendaScreen())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Pas de connexion')
  })

  it('setView change la vue', async () => {
    mockGetAgenda.mockResolvedValue([])
    const { result } = renderHook(() => useAgendaScreen())
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => { result.current.setView('semaine') })
    expect(result.current.view).toBe('semaine')
  })
})
