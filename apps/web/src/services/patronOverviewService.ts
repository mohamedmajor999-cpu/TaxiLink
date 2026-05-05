import { createClient } from '@/lib/supabase/client'

export interface PatronKPIs {
  driversOnline: number
  driversTotal: number
  activeMissions: number
  todayRevenue: number
  yesterdayRevenue: number
  alerts: number
  revenueLast7Days: number[]  // [d-6, d-5, ..., d-0] (aujourd'hui en dernier)
}

export interface PatronActivity {
  id: string
  time: string  // HH:MM
  type: 'accept' | 'complete'
  from: string
  to: string
  price: number | null
}

export const patronOverviewService = {
  async getKPIs(orgId: string): Promise<PatronKPIs> {
    const supabase = createClient()
    const sevenDaysAgo = isoDateInDays(-6)

    const [drivers, online, active, completedRecent, docs] = await Promise.all([
      supabase.from('drivers').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      supabase.from('drivers').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('is_online', true),
      supabase.from('missions').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'IN_PROGRESS'),
      supabase.from('missions').select('completed_at, price_eur').eq('organization_id', orgId).gte('completed_at', sevenDaysAgo).not('price_eur', 'is', null).not('completed_at', 'is', null),
      supabase.from('driver_documents').select('id, drivers!inner(organization_id)', { count: 'exact', head: true })
        .eq('drivers.organization_id', orgId).lte('expiry_date', isoDateInDays(60)),
    ])

    const revenueLast7Days = bucketRevenueByDay(completedRecent.data ?? [])

    return {
      driversTotal: drivers.count ?? 0,
      driversOnline: online.count ?? 0,
      activeMissions: active.count ?? 0,
      todayRevenue: revenueLast7Days[6] ?? 0,
      yesterdayRevenue: revenueLast7Days[5] ?? 0,
      revenueLast7Days,
      alerts: docs.count ?? 0,
    }
  },

  async getRecentActivity(orgId: string, limit = 10): Promise<PatronActivity[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('missions')
      .select('id, status, price_eur, accepted_at, completed_at, departure, destination')
      .eq('organization_id', orgId)
      .order('updated_at', { ascending: false })
      .limit(limit)
    if (error) throw new Error(error.message)

    return (data ?? []).map((m) => {
      const isComplete = !!m.completed_at
      const time = (isComplete ? toHHMM(m.completed_at) : toHHMM(m.accepted_at)) ?? '--:--'
      return {
        id: m.id,
        time,
        type: isComplete ? 'complete' : 'accept',
        from: shortAddr(m.departure),
        to: shortAddr(m.destination),
        price: m.price_eur,
      }
    })
  },
}

function isoDateInDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function bucketRevenueByDay(missions: { completed_at: string | null; price_eur: number | null }[]): number[] {
  const buckets = new Array<number>(7).fill(0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayMs = today.getTime()
  const dayMs = 24 * 60 * 60 * 1000
  for (const m of missions) {
    if (!m.completed_at || m.price_eur == null) continue
    const dayStart = new Date(m.completed_at)
    dayStart.setHours(0, 0, 0, 0)
    const offset = Math.round((dayStart.getTime() - todayMs) / dayMs)
    const bucketIdx = 6 + offset
    if (bucketIdx >= 0 && bucketIdx <= 6) buckets[bucketIdx] += m.price_eur
  }
  return buckets
}

function toHHMM(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function shortAddr(s: string): string {
  return s.split(',')[0].trim() || s
}
