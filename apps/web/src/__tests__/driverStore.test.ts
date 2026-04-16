import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDriverStore } from '@/store/driverStore'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockGetProfile = vi.fn()
const mockGetDriver  = vi.fn()
const mockSetOnline  = vi.fn()

vi.mock('@/services/profileService', () => ({
  profileService: { getProfile: (...a: unknown[]) => mockGetProfile(...a) },
}))

vi.mock('@/services/driverService', () => ({
  driverService: {
    getDriver:  (...a: unknown[]) => mockGetDriver(...a),
    setOnline:  (...a: unknown[]) => mockSetOnline(...a),
  },
}))

const defaultDriver = {
  id: '',
  name: 'Chauffeur',
  email: '',
  cpamEnabled: false,
  rating: 0,
  totalRides: 0,
  isOnline: false,
  createdAt: expect.any(String),
}

beforeEach(() => {
  vi.clearAllMocks()
  useDriverStore.setState({
    driver: {
      id: '',
      name: 'Chauffeur',
      email: '',
      cpamEnabled: false,
      rating: 0,
      totalRides: 0,
      isOnline: false,
      createdAt: new Date().toISOString(),
    },
    isLoading: false,
  })
})

// ─── État initial ─────────────────────────────────────────────────────────────
describe('driverStore — état initial', () => {
  it('démarre avec le driver par défaut', () => {
    const { driver } = useDriverStore.getState()
    expect(driver.name).toBe('Chauffeur')
    expect(driver.isOnline).toBe(false)
    expect(driver.cpamEnabled).toBe(false)
  })

  it('isLoading est false au départ', () => {
    const { isLoading } = useDriverStore.getState()
    expect(isLoading).toBe(false)
  })
})

// ─── load() ───────────────────────────────────────────────────────────────────
describe('driverStore — load()', () => {
  it('charge le profil et les données chauffeur', async () => {
    mockGetProfile.mockResolvedValue({
      full_name: 'Pierre Martin',
      phone: '0601020304',
      avatar_url: null,
      created_at: '2024-01-01',
    })
    mockGetDriver.mockResolvedValue({
      vehicle_model: 'Peugeot 508',
      vehicle_type: 'berline',
      cpam_enabled: true,
      rating: 4.8,
      total_rides: 320,
      is_online: true,
    })

    await useDriverStore.getState().load('drv-1', 'pierre@taxi.fr')

    const { driver, isLoading } = useDriverStore.getState()
    expect(driver.id).toBe('drv-1')
    expect(driver.name).toBe('Pierre Martin')
    expect(driver.email).toBe('pierre@taxi.fr')
    expect(driver.phone).toBe('0601020304')
    expect(driver.vehicle).toBe('Peugeot 508')
    expect(driver.cpamEnabled).toBe(true)
    expect(driver.rating).toBe(4.8)
    expect(driver.totalRides).toBe(320)
    expect(driver.isOnline).toBe(true)
    expect(isLoading).toBe(false)
  })

  it('utilise des valeurs par défaut si les données sont null', async () => {
    mockGetProfile.mockResolvedValue(null)
    mockGetDriver.mockResolvedValue(null)

    await useDriverStore.getState().load('drv-2', 'x@taxi.fr')

    const { driver } = useDriverStore.getState()
    expect(driver.name).toBe('Chauffeur')
    expect(driver.cpamEnabled).toBe(false)
    expect(driver.rating).toBe(0)
    expect(driver.isOnline).toBe(false)
  })

  it('remet isLoading à false même en cas d\'erreur', async () => {
    mockGetProfile.mockRejectedValue(new Error('DB error'))
    mockGetDriver.mockRejectedValue(new Error('DB error'))

    try {
      await useDriverStore.getState().load('drv-err', 'err@taxi.fr')
    } catch {
      // attendu
    }

    expect(useDriverStore.getState().isLoading).toBe(false)
  })
})

// ─── setOnline() ──────────────────────────────────────────────────────────────
describe('driverStore — setOnline()', () => {
  it('met isOnline à true', () => {
    useDriverStore.setState({ driver: { ...useDriverStore.getState().driver, id: 'drv-1' } })
    mockSetOnline.mockResolvedValue(undefined)

    useDriverStore.getState().setOnline(true)

    expect(useDriverStore.getState().driver.isOnline).toBe(true)
  })

  it('met isOnline à false', () => {
    useDriverStore.setState({ driver: { ...useDriverStore.getState().driver, id: 'drv-1', isOnline: true } })
    mockSetOnline.mockResolvedValue(undefined)

    useDriverStore.getState().setOnline(false)

    expect(useDriverStore.getState().driver.isOnline).toBe(false)
  })

  it('n\'appelle pas driverService si id est vide', () => {
    useDriverStore.getState().setOnline(true)
    expect(mockSetOnline).not.toHaveBeenCalled()
  })
})

// ─── updateDriver() ───────────────────────────────────────────────────────────
describe('driverStore — updateDriver()', () => {
  it('met à jour partiellement le driver', () => {
    useDriverStore.getState().updateDriver({ name: 'Jean Taxi', rating: 4.5 })
    const { driver } = useDriverStore.getState()
    expect(driver.name).toBe('Jean Taxi')
    expect(driver.rating).toBe(4.5)
  })

  it('conserve les autres champs', () => {
    useDriverStore.setState({
      driver: { ...useDriverStore.getState().driver, cpamEnabled: true },
    })
    useDriverStore.getState().updateDriver({ name: 'Nouveau' })
    expect(useDriverStore.getState().driver.cpamEnabled).toBe(true)
  })
})

// ─── incrementTodayStats() ────────────────────────────────────────────────────
describe('driverStore — incrementTodayStats()', () => {
  it('incrémente les stats du jour', () => {
    useDriverStore.getState().incrementTodayStats(1, 12.5, 28.0)
    const { driver } = useDriverStore.getState()
    expect(driver.todayRides).toBe(1)
    expect(driver.todayKm).toBe(12.5)
    expect(driver.todayEarnings).toBe(28.0)
  })

  it('accumule les appels successifs', () => {
    useDriverStore.getState().incrementTodayStats(1, 10, 20)
    useDriverStore.getState().incrementTodayStats(2, 5, 15)
    const { driver } = useDriverStore.getState()
    expect(driver.todayRides).toBe(3)
    expect(driver.todayKm).toBe(15)
    expect(driver.todayEarnings).toBe(35)
  })
})
