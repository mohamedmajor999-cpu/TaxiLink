import { createClient } from '@/lib/supabase/client'

export interface DriverDocument {
  id: string
  label: string
  type: string
  status: string
  expiry_date: string | null
  daysLeft: number | null
}

export interface DriverDetail {
  id: string
  name: string
  initials: string
  phone: string | null
  email: string | null
  is_online: boolean
  vehicle_model: string | null
  vehicle_plate: string | null
  rating: number
  total_rides: number
  cpam_enabled: boolean
  is_verified: boolean
  documents: DriverDocument[]
  monthMissions: number
  monthRevenue: number
}

export const patronDriverDetailService = {
  async getDriverDetail(driverId: string): Promise<DriverDetail | null> {
    const supabase = createClient()
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const [driverRes, profileRes, docsRes, missionsRes] = await Promise.all([
      supabase.from('drivers').select('*').eq('id', driverId).maybeSingle(),
      supabase.from('profiles').select('first_name, last_name, phone').eq('id', driverId).maybeSingle(),
      supabase.from('driver_documents').select('id, label, type, status, expiry_date').eq('driver_id', driverId).order('expiry_date', { ascending: true, nullsFirst: false }),
      supabase.from('missions').select('price_eur, completed_at').eq('driver_id', driverId).gte('completed_at', monthStart.toISOString()).not('completed_at', 'is', null),
    ])

    const driver = driverRes.data
    if (!driver) return null
    const profile = profileRes.data
    const fn = profile?.first_name ?? ''
    const ln = profile?.last_name ?? ''
    const name = `${fn} ${ln}`.trim() || 'Chauffeur'
    const initials = `${fn[0] ?? '?'}${ln[0] ?? '?'}`.toUpperCase()

    const today = Date.now()
    const documents: DriverDocument[] = (docsRes.data ?? []).map((d) => ({
      id: d.id,
      label: d.label,
      type: d.type,
      status: d.status,
      expiry_date: d.expiry_date,
      daysLeft: d.expiry_date ? Math.ceil((new Date(d.expiry_date).getTime() - today) / (1000 * 60 * 60 * 24)) : null,
    }))

    const monthMissions = (missionsRes.data ?? []).length
    const monthRevenue = (missionsRes.data ?? []).reduce((s, m) => s + (m.price_eur ?? 0), 0)

    return {
      id: driver.id,
      name,
      initials,
      phone: profile?.phone ?? null,
      email: null,
      is_online: driver.is_online,
      vehicle_model: driver.vehicle_model,
      vehicle_plate: driver.vehicle_plate,
      rating: driver.rating,
      total_rides: driver.total_rides,
      cpam_enabled: driver.cpam_enabled,
      is_verified: driver.is_verified,
      documents,
      monthMissions,
      monthRevenue,
    }
  },
}
