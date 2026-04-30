import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/adminAuth'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

interface ProfileRow {
  id:         string
  role:       string | null
  created_at: string
}

interface DriverRow {
  id:           string
  is_online:    boolean
  last_seen_at: string | null
}

interface LoginEvent {
  user_id:    string | null
  created_at: string
}

interface DailyLogins {
  period:      string
  logins:      number
  uniqueUsers: number
}

const ONLINE_TTL_MS = 2 * 60 * 1000

export async function GET() {
  const auth = await assertAdmin()
  if (!auth.ok) return auth.response

  const supabase = createAdminSupabaseClient()
  const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()

  const [profilesRes, driversRes, loginsRes] = await Promise.all([
    supabase.from('profiles').select('id, role, created_at'),
    supabase.from('drivers').select('id, is_online, last_seen_at'),
    supabase.from('auth_login_events').select('user_id, created_at').gte('created_at', since),
  ])

  if (profilesRes.error) return NextResponse.json({ error: profilesRes.error.message }, { status: 500 })
  if (driversRes.error)  return NextResponse.json({ error: driversRes.error.message },  { status: 500 })
  if (loginsRes.error)   return NextResponse.json({ error: loginsRes.error.message },   { status: 500 })

  const profiles = (profilesRes.data ?? []) as ProfileRow[]
  const drivers  = (driversRes.data ?? [])  as DriverRow[]
  const logins   = (loginsRes.data ?? [])   as LoginEvent[]

  const now = Date.now()
  const onlineDrivers = drivers.filter(
    (d) => d.is_online && d.last_seen_at && now - new Date(d.last_seen_at).getTime() < ONLINE_TTL_MS
  ).length

  const totalDrivers = profiles.filter((p) => p.role === 'driver').length
  const totalClients = profiles.filter((p) => p.role === 'client').length
  const newDrivers30d = profiles.filter(
    (p) => p.role === 'driver' && Date.now() - new Date(p.created_at).getTime() < 30 * 24 * 60 * 60 * 1000
  ).length
  const newClients30d = profiles.filter(
    (p) => p.role === 'client' && Date.now() - new Date(p.created_at).getTime() < 30 * 24 * 60 * 60 * 1000
  ).length

  const ms60d = 60 * 24 * 60 * 60 * 1000
  const ms30d = 30 * 24 * 60 * 60 * 1000
  const newDriversPrev30d = profiles.filter(
    (p) => p.role === 'driver' && (() => {
      const t = Date.now() - new Date(p.created_at).getTime()
      return t >= ms30d && t < ms60d
    })()
  ).length
  const newClientsPrev30d = profiles.filter(
    (p) => p.role === 'client' && (() => {
      const t = Date.now() - new Date(p.created_at).getTime()
      return t >= ms30d && t < ms60d
    })()
  ).length

  const logins30d = logins.filter((l) => now - new Date(l.created_at).getTime() < ms30d).length
  const loginsPrev30d = logins.filter((l) => {
    const t = now - new Date(l.created_at).getTime()
    return t >= ms30d && t < ms60d
  }).length

  return NextResponse.json({
    counters: {
      totalUsers:    profiles.length,
      totalDrivers,
      totalClients,
      newDrivers30d,
      newClients30d,
      onlineDrivers,
      totalLogins90d: logins.filter((l) => now - new Date(l.created_at).getTime() < 90 * 24 * 60 * 60 * 1000).length,
    },
    comparisons: {
      newDrivers:  { current: newDrivers30d,  previous: newDriversPrev30d },
      newClients:  { current: newClients30d,  previous: newClientsPrev30d },
      logins:      { current: logins30d,      previous: loginsPrev30d },
    },
    daily:   bucketLogins(logins, dayKey,   30),
    weekly:  bucketLogins(logins, weekKey,  12),
    monthly: bucketLogins(logins, monthKey, 12),
  })
}

function dayKey(iso: string):   string { return iso.slice(0, 10) }
function monthKey(iso: string): string { return iso.slice(0, 7) }
function weekKey(iso: string):  string {
  const d = new Date(iso)
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dayNum = (target.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNum + 3)
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
  const week = 1 + Math.round(((target.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function bucketLogins(rows: LoginEvent[], keyFn: (iso: string) => string, limit: number): DailyLogins[] {
  const map = new Map<string, { period: string; logins: number; users: Set<string> }>()
  for (const r of rows) {
    const k = keyFn(r.created_at)
    const b = map.get(k) ?? { period: k, logins: 0, users: new Set<string>() }
    b.logins += 1
    if (r.user_id) b.users.add(r.user_id)
    map.set(k, b)
  }
  return Array.from(map.values())
    .sort((a, b) => b.period.localeCompare(a.period))
    .slice(0, limit)
    .map((b) => ({ period: b.period, logins: b.logins, uniqueUsers: b.users.size }))
}
