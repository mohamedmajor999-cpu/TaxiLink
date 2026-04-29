import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/adminAuth'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

interface MissionRow {
  id:             string
  status:         string
  created_at:     string
  accepted_at:    string | null
  completed_at:   string | null
  price_eur:      number | null
  price_min_eur:  number | null
  price_max_eur:  number | null
}

interface DailyBucket {
  period:        string
  posted:        number
  accepted:      number
  completed:     number
  totalAmount:   number
  acceptanceRate: number
}

export async function GET() {
  const auth = await assertAdmin()
  if (!auth.ok) return auth.response

  const supabase = createAdminSupabaseClient()
  const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('missions')
    .select('id, status, created_at, accepted_at, completed_at, price_eur, price_min_eur, price_max_eur')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []) as MissionRow[]

  return NextResponse.json({
    daily:   bucketize(rows, dayKey,   30),
    weekly:  bucketize(rows, weekKey,  12),
    monthly: bucketize(rows, monthKey, 12),
    totals:  totals(rows),
  })
}

function unitPrice(r: MissionRow): number {
  if (r.price_eur != null) return Number(r.price_eur)
  if (r.price_min_eur != null && r.price_max_eur != null) {
    return (Number(r.price_min_eur) + Number(r.price_max_eur)) / 2
  }
  return 0
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

function bucketize(rows: MissionRow[], keyFn: (iso: string) => string, limit: number): DailyBucket[] {
  const map = new Map<string, DailyBucket>()
  for (const r of rows) {
    const k = keyFn(r.created_at)
    const b = map.get(k) ?? { period: k, posted: 0, accepted: 0, completed: 0, totalAmount: 0, acceptanceRate: 0 }
    b.posted += 1
    if (r.accepted_at)  b.accepted += 1
    if (r.completed_at) b.completed += 1
    b.totalAmount += unitPrice(r)
    map.set(k, b)
  }
  const result = Array.from(map.values())
  for (const b of result) {
    b.acceptanceRate = b.posted > 0 ? Math.round((b.accepted / b.posted) * 100) : 0
  }
  return result.sort((a, b) => b.period.localeCompare(a.period)).slice(0, limit)
}

function totals(rows: MissionRow[]) {
  let posted = 0, accepted = 0, completed = 0, totalAmount = 0, accAmountCount = 0
  for (const r of rows) {
    posted += 1
    const p = unitPrice(r)
    if (p > 0) { totalAmount += p; accAmountCount += 1 }
    if (r.accepted_at)  accepted += 1
    if (r.completed_at) completed += 1
  }
  return {
    posted,
    accepted,
    completed,
    totalAmount,
    averageAmount:  accAmountCount > 0 ? totalAmount / accAmountCount : 0,
    acceptanceRate: posted > 0 ? Math.round((accepted / posted) * 100) : 0,
  }
}
