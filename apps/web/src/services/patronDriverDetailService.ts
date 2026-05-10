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
  // Defense-in-depth multi-tenancy : si orgId fourni, le query drivers filtre
  // sur organization_id pour qu'un patron ne puisse pas inspecter un chauffeur
  // hors de son org meme si la RLS sur drivers est trop laxe (p.ex. en cas de
  // migration policy). Sans orgId : comportement legacy (ex. caller admin).
  async getDriverDetail(driverId: string, orgId?: string | null): Promise<DriverDetail | null> {
    const supabase = createClient()
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    let driverQuery = supabase.from('drivers').select('*').eq('id', driverId)
    if (orgId) driverQuery = driverQuery.eq('organization_id', orgId)
    let missionsQuery = supabase
      .from('missions')
      .select('price_eur, completed_at')
      .eq('driver_id', driverId)
      .gte('completed_at', monthStart.toISOString())
      .not('completed_at', 'is', null)
    if (orgId) missionsQuery = missionsQuery.eq('organization_id', orgId)

    const [driverRes, profileRes, docsRes, missionsRes] = await Promise.all([
      driverQuery.maybeSingle(),
      supabase.from('profiles').select('first_name, last_name, phone').eq('id', driverId).maybeSingle(),
      supabase.from('driver_documents').select('id, label, type, status, expiry_date').eq('driver_id', driverId).order('expiry_date', { ascending: true, nullsFirst: false }),
      missionsQuery,
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
