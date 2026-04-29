import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/adminAuth'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

interface ProfileRow {
  id:         string
  first_name: string | null
  last_name:  string | null
  phone:      string | null
}

interface DriverRow {
  id:           string
  is_online:    boolean
  total_rides:  number
  rating:       number
  last_seen_at: string | null
}

interface MissionRow {
  id:            string
  driver_id:     string | null
  shared_by:     string | null
  status:        string
  accepted_at:   string | null
  completed_at:  string | null
  price_eur:     number | null
  price_min_eur: number | null
  price_max_eur: number | null
  created_at:    string
}

interface AiUsageRow {
  user_id:  string | null
  cost_usd: number
}

export interface DriverRanking {
  userId:        string
  name:          string
  phone:         string | null
  isOnline:      boolean
  rating:        number
  posted:        number
  accepted:      number
  completed:     number
  caEur:         number
  apiCostUsd:    number
}

const ONLINE_TTL_MS = 2 * 60 * 1000

export async function GET() {
  const auth = await assertAdmin()
  if (!auth.ok) return auth.response

  const supabase = createAdminSupabaseClient()
  const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()

  const [driversRes, profilesRes, missionsRes, usageRes] = await Promise.all([
    supabase.from('drivers').select('id, is_online, total_rides, rating, last_seen_at'),
    supabase.from('profiles').select('id, first_name, last_name, phone').eq('role', 'driver'),
    supabase.from('missions').select('id, driver_id, shared_by, status, accepted_at, completed_at, price_eur, price_min_eur, price_max_eur, created_at').gte('created_at', since),
    supabase.from('ai_usage').select('user_id, cost_usd').gte('created_at', since),
  ])

  if (driversRes.error)  return NextResponse.json({ error: driversRes.error.message },  { status: 500 })
  if (profilesRes.error) return NextResponse.json({ error: profilesRes.error.message }, { status: 500 })
  if (missionsRes.error) return NextResponse.json({ error: missionsRes.error.message }, { status: 500 })
  if (usageRes.error)    return NextResponse.json({ error: usageRes.error.message },    { status: 500 })

  const drivers  = (driversRes.data  ?? []) as DriverRow[]
  const profiles = (profilesRes.data ?? []) as ProfileRow[]
  const missions = (missionsRes.data ?? []) as MissionRow[]
  const usage    = (usageRes.data    ?? []) as AiUsageRow[]

  const profById = new Map(profiles.map((p) => [p.id, p]))
  const now = Date.now()

  const ranking: DriverRanking[] = drivers.map((d) => {
    const p = profById.get(d.id)
    const isOnlineFresh = d.is_online && d.last_seen_at != null
      && now - new Date(d.last_seen_at).getTime() < ONLINE_TTL_MS

    let posted = 0, accepted = 0, completed = 0, caEur = 0
    for (const m of missions) {
      if (m.shared_by === d.id) posted += 1
      if (m.driver_id === d.id) {
        if (m.accepted_at) accepted += 1
        if (m.completed_at) {
          completed += 1
          caEur += unitPrice(m)
        }
      }
    }

    let apiCostUsd = 0
    for (const u of usage) {
      if (u.user_id === d.id) apiCostUsd += Number(u.cost_usd)
    }

    return {
      userId:     d.id,
      name:       formatName(p),
      phone:      p?.phone ?? null,
      isOnline:   isOnlineFresh,
      rating:     Number(d.rating ?? 0),
      posted,
      accepted,
      completed,
      caEur,
      apiCostUsd,
    }
  })

  ranking.sort((a, b) => b.completed - a.completed)
  return NextResponse.json({ items: ranking })
}

function formatName(p: ProfileRow | undefined): string {
  if (!p) return 'Sans nom'
  const n = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()
  return n || 'Sans nom'
}

function unitPrice(r: MissionRow): number {
  if (r.price_eur != null) return Number(r.price_eur)
  if (r.price_min_eur != null && r.price_max_eur != null) {
    return (Number(r.price_min_eur) + Number(r.price_max_eur)) / 2
  }
  return 0
}
