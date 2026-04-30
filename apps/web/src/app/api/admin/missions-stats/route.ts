import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/adminAuth'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { bucketize, dayKey, weekKey, monthKey, unitPrice, type MissionRow } from './bucketize'

export async function GET() {
  const auth = await assertAdmin()
  if (!auth.ok) return auth.response

  const supabase = createAdminSupabaseClient()
  const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('missions')
    .select('id, status, type, departement, medical_motif, view_count, created_at, accepted_at, completed_at, price_eur, price_min_eur, price_max_eur')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []) as MissionRow[]

  const now = Date.now()
  const month30 = now - 30 * 24 * 60 * 60 * 1000
  const month60 = now - 60 * 24 * 60 * 60 * 1000
  const current30  = rows.filter((r) => new Date(r.created_at).getTime() >= month30)
  const previous30 = rows.filter((r) => {
    const t = new Date(r.created_at).getTime()
    return t < month30 && t >= month60
  })

  return NextResponse.json({
    daily:   bucketize(rows, dayKey,   30),
    weekly:  bucketize(rows, weekKey,  12),
    monthly: bucketize(rows, monthKey, 12),
    totals:  totals(rows),
    funnel:  funnel(current30),
    heatmap: heatmap(rows),
    comparisons: {
      current:  totals(current30),
      previous: totals(previous30),
    },
  })
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

function funnel(rows: MissionRow[]) {
  let posted = 0, viewed = 0, accepted = 0, completed = 0
  for (const r of rows) {
    posted += 1
    if ((r.view_count ?? 0) > 0) viewed += 1
    if (r.accepted_at)  accepted += 1
    if (r.completed_at) completed += 1
  }
  return { posted, viewed, accepted, completed }
}

// Matrice 7 jours × 24h. Index 0 = lundi (ISO), heure UTC.
function heatmap(rows: MissionRow[]): number[][] {
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
  for (const r of rows) {
    const d = new Date(r.created_at)
    const dow = (d.getUTCDay() + 6) % 7
    const hour = d.getUTCHours()
    grid[dow][hour] += 1
  }
  return grid
}
