import { createClient } from '@/lib/supabase/client'

export interface PatronFleetMember {
  id: string
  name: string
  initials: string
  status: 'in-mission' | 'online' | 'offline'
  vehicle: string | null
  lat: number | null
  lng: number | null
  todayMissions: number
  todayRevenue: number
  rating: number
}

export interface PatronDocAlert {
  id: string
  driver: string
  doc: string
  daysLeft: number
}

export const patronFleetService = {
  async getFleetPositions(orgId: string): Promise<PatronFleetMember[]> {
    const supabase = createClient()
    const todayStart = startOfTodayIso()

    const { data: drivers, error: dErr } = await supabase
      .from('drivers')
      .select('id, is_online, vehicle_plate, current_lat, current_lng, rating')
      .eq('organization_id', orgId)
    if (dErr) throw new Error(dErr.message)

    const driverIds = (drivers ?? []).map((d) => d.id)
    if (driverIds.length === 0) return []

    const [profilesRes, missionsRes] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name').in('id', driverIds),
      supabase.from('missions').select('driver_id, status, price_eur, completed_at')
        .in('driver_id', driverIds)
        .gte('created_at', todayStart),
    ])

    const profilesById = new Map((profilesRes.data ?? []).map((p) => [p.id, p]))
    const missionsToday = missionsRes.data ?? []

    return (drivers ?? []).map((d) => {
      const mine = missionsToday.filter((m) => m.driver_id === d.id)
      const completed = mine.filter((m) => m.completed_at)
      const todayRevenue = completed.reduce((s, m) => s + (m.price_eur ?? 0), 0)
      const inProgress = mine.some((m) => m.status === 'IN_PROGRESS')
      const profile = profilesById.get(d.id)
      const fn = profile?.first_name ?? ''
      const ln = profile?.last_name ?? ''
      const name = `${fn} ${ln}`.trim() || 'Chauffeur'
      const initials = `${(fn[0] ?? '?')}${(ln[0] ?? '?')}`.toUpperCase()
      return {
        id: d.id,
        name,
        initials,
        status: inProgress ? 'in-mission' : d.is_online ? 'online' : 'offline',
        vehicle: d.vehicle_plate,
        lat: d.current_lat == null ? null : Number(d.current_lat),
        lng: d.current_lng == null ? null : Number(d.current_lng),
        todayMissions: completed.length,
        todayRevenue,
        rating: d.rating,
      }
    })
  },

  async getDocAlerts(orgId: string, daysAhead = 60): Promise<PatronDocAlert[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('driver_documents')
      .select('id, label, expiry_date, drivers!inner(id, organization_id, profiles!inner(first_name, last_name))')
      .eq('drivers.organization_id', orgId)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', isoDateInDays(daysAhead))
      .order('expiry_date', { ascending: true })
    if (error) throw new Error(error.message)

    const today = Date.now()
    return (data ?? []).map((d) => {
      const driver = d.drivers as unknown as { profiles: { first_name: string | null; last_name: string | null } }
      const name = `${driver.profiles.first_name ?? ''} ${driver.profiles.last_name ?? ''}`.trim() || 'Chauffeur'
      const daysLeft = Math.ceil((new Date(d.expiry_date!).getTime() - today) / (1000 * 60 * 60 * 24))
      return { id: d.id, driver: name, doc: d.label, daysLeft }
    })
  },
}

function startOfTodayIso(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function isoDateInDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
