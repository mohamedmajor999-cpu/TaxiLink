import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchPublicMission, fetchDriverCount } from '@/services/publicMissionService'

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: () => ({ from: mockFrom }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

function chain(finalResult: { data: unknown; error: unknown; count?: number }) {
  const terminal: Record<string, ReturnType<typeof vi.fn>> = {}
  const handler: ProxyHandler<typeof terminal> = {
    get(target, prop: string) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => unknown) => Promise.resolve(finalResult).then(resolve)
      }
      if (!target[prop]) {
        target[prop] = vi.fn().mockReturnValue(new Proxy(terminal, handler))
      }
      return target[prop]
    },
  }
  return new Proxy(terminal, handler)
}

describe('fetchPublicMission', () => {
  it('retourne null si la mission n existe pas', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: null }))
    const result = await fetchPublicMission('m-ghost')
    expect(result).toBeNull()
  })

  it('retourne null si erreur Supabase', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: { message: 'fail' } }))
    const result = await fetchPublicMission('m-1')
    expect(result).toBeNull()
  })

  it('expose les champs non-sensibles + sharer + groupName quand mission trouvee', async () => {
    let call = 0
    mockFrom.mockImplementation((table: string) => {
      call++
      if (call === 1 && table === 'missions') return chain({
        data: {
          id: 'm-1', type: 'CPAM',
          departure: 'A', destination: 'B', scheduled_at: '2026-05-08T10:00:00Z',
          price_eur: 25, price_min_eur: null, price_max_eur: null,
          distance_km: 8, duration_min: 15, static_duration_min: 12,
          status: 'AVAILABLE', return_trip: false,
          medical_motif: 'CONSULTATION', transport_type: 'SEATED', passengers: 1,
          visibility: 'GROUP', shared_by: 'driver-1',
          mission_groups: [{ groups: { name: 'Taxi 13' } }],
        },
        error: null,
      })
      if (call === 2 && table === 'profiles') return chain({
        data: { first_name: 'Alice', last_name: 'Martin', full_name: 'Alice Martin' },
        error: null,
      })
      throw new Error(`Unexpected: ${table} (call ${call})`)
    })

    const result = await fetchPublicMission('m-1')
    expect(result).toEqual(expect.objectContaining({
      id: 'm-1',
      type: 'CPAM',
      departure: 'A',
      destination: 'B',
      sharer: { fullName: 'Alice Martin', initials: 'AM' },
      groupName: 'Taxi 13',
    }))
    // Verifie l'absence de champs PII patient
    expect(result).not.toHaveProperty('patient_name')
    expect(result).not.toHaveProperty('phone')
    expect(result).not.toHaveProperty('notes')
  })

  it('renvoie sharer=null si shared_by est null', async () => {
    mockFrom.mockReturnValue(chain({
      data: {
        id: 'm-1', type: 'PRIVE',
        departure: 'A', destination: 'B', scheduled_at: '2026-05-08T10:00:00Z',
        price_eur: 30, price_min_eur: null, price_max_eur: null,
        distance_km: null, duration_min: null, static_duration_min: null,
        status: 'AVAILABLE', return_trip: false,
        medical_motif: null, transport_type: null, passengers: null,
        visibility: 'PUBLIC', shared_by: null,
        mission_groups: [],
      },
      error: null,
    }))
    const result = await fetchPublicMission('m-1')
    expect(result?.sharer).toBeNull()
    expect(result?.groupName).toBeNull()
  })

  it('compose les initiales depuis full_name quand first/last sont null', async () => {
    let call = 0
    mockFrom.mockImplementation(() => {
      call++
      if (call === 1) return chain({
        data: {
          id: 'm-1', type: 'CPAM',
          departure: 'A', destination: 'B', scheduled_at: '2026-05-08T10:00:00Z',
          price_eur: 25, price_min_eur: null, price_max_eur: null,
          distance_km: null, duration_min: null, static_duration_min: null,
          status: 'AVAILABLE', return_trip: false,
          medical_motif: null, transport_type: null, passengers: null,
          visibility: 'GROUP', shared_by: 'driver-1',
          mission_groups: [],
        },
        error: null,
      })
      return chain({
        data: { first_name: null, last_name: null, full_name: 'jean dupont' },
        error: null,
      })
    })
    const result = await fetchPublicMission('m-1')
    // Fallback : full[0..2].toUpperCase() → "JE"
    expect(result?.sharer).toEqual({ fullName: 'jean dupont', initials: 'JE' })
  })
})

describe('fetchDriverCount', () => {
  it('retourne le nombre de chauffeurs', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: null, count: 42 }))
    const result = await fetchDriverCount()
    expect(result).toBe(42)
  })

  it('retourne 0 si count null', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: null }))
    const result = await fetchDriverCount()
    expect(result).toBe(0)
  })
})
