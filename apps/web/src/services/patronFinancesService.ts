import { createClient } from '@/lib/supabase/client'

export interface FinanceKPIs {
  totalRevenue: number
  monthRevenue: number
  weekRevenue: number
  cpamRevenue: number  // CA CPAM mois courant
  privateRevenue: number  // CA Prive mois courant
  revenueLast30Days: number[]  // [j-29, ..., j-0]
}

export interface FinanceMission {
  id: string
  type: string
  scheduled_at: string
  price_eur: number | null
  driver_name: string
  patient_name: string | null
  paid: boolean
}

export const patronFinancesService = {
  async getFinances(orgId: string): Promise<FinanceKPIs> {
    const supabase = createClient()
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)
    const last30 = new Date()
    last30.setDate(last30.getDate() - 29)
    last30.setHours(0, 0, 0, 0)

    const [allRes, monthRes, weekRes, lastRes] = await Promise.all([
      supabase.from('missions').select('price_eur').eq('organization_id', orgId).not('completed_at', 'is', null).not('price_eur', 'is', null),
      supabase.from('missions').select('price_eur, type').eq('organization_id', orgId).gte('completed_at', monthStart.toISOString()).not('price_eur', 'is', null),
      supabase.from('missions').select('price_eur').eq('organization_id', orgId).gte('completed_at', weekStart.toISOString()).not('price_eur', 'is', null),
      supabase.from('missions').select('completed_at, price_eur').eq('organization_id', orgId).gte('completed_at', last30.toISOString()).not('price_eur', 'is', null).not('completed_at', 'is', null),
    ])

    const sum = (rows: { price_eur: number | null }[] | null) =>
      (rows ?? []).reduce((s, r) => s + (r.price_eur ?? 0), 0)

    const monthRows = monthRes.data ?? []
    const cpamRevenue = monthRows.filter((m) => m.type === 'CPAM').reduce((s, m) => s + (m.price_eur ?? 0), 0)
    const privateRevenue = monthRows.filter((m) => m.type !== 'CPAM').reduce((s, m) => s + (m.price_eur ?? 0), 0)

    const buckets = new Array<number>(30).fill(0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayMs = today.getTime()
    const dayMs = 24 * 60 * 60 * 1000
    for (const m of (lastRes.data ?? [])) {
      if (!m.completed_at || m.price_eur == null) continue
      const dStart = new Date(m.completed_at)
      dStart.setHours(0, 0, 0, 0)
      const offset = Math.round((dStart.getTime() - todayMs) / dayMs)
      const idx = 29 + offset
      if (idx >= 0 && idx <= 29) buckets[idx] += m.price_eur
    }

    return {
      totalRevenue: sum(allRes.data),
      monthRevenue: sum(monthRows),
      weekRevenue: sum(weekRes.data),
      cpamRevenue,
      privateRevenue,
      revenueLast30Days: buckets,
    }
  },

  async getRecentCpamMissions(orgId: string, limit = 20): Promise<FinanceMission[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('missions')
      .select('id, type, scheduled_at, price_eur, patient_name, driver_id')
      .eq('organization_id', orgId)
      .eq('type', 'CPAM')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(limit)
    if (error) throw new Error(error.message)

    const driverIds = Array.from(new Set((data ?? []).map((m) => m.driver_id).filter((id): id is string => !!id)))
    let driverNames: Record<string, string> = {}
    if (driverIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name').in('id', driverIds)
      driverNames = Object.fromEntries(
        (profiles ?? []).map((p) => [p.id, `${p.first_name?.[0] ?? '?'}. ${p.last_name ?? ''}`.trim()])
      )
    }

    return (data ?? []).map((m) => ({
      id: m.id,
      type: m.type,
      scheduled_at: m.scheduled_at,
      price_eur: m.price_eur,
      driver_name: m.driver_id ? driverNames[m.driver_id] ?? 'Chauffeur' : '—',
      patient_name: m.patient_name,
      paid: false,  // V1 : pas de notion de paiement CPAM dans le schema
    }))
  },
}
