import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/adminAuth'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

interface MissionRow {
  type:           string | null
  departement:    string | null
  medical_motif:  string | null
  price_eur:      number | null
  price_min_eur:  number | null
  price_max_eur:  number | null
  accepted_at:    string | null
  completed_at:   string | null
}

export interface BreakdownRow {
  key:        string
  count:      number
  caEur:      number
  acceptedPct: number
}

export async function GET() {
  const auth = await assertAdmin()
  if (!auth.ok) return auth.response

  const supabase = createAdminSupabaseClient()
  const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('missions')
    .select('type, departement, medical_motif, price_eur, price_min_eur, price_max_eur, accepted_at, completed_at')
    .gte('created_at', since)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []) as MissionRow[]

  return NextResponse.json({
    byType:        groupAndSort(rows, (r) => r.type ?? 'Inconnu', 10),
    byMotif:       groupAndSort(rows.filter((r) => r.type === 'CPAM'), (r) => r.medical_motif ?? 'Non précisé', 10),
    byDepartement: groupAndSort(rows, (r) => r.departement ?? 'Inconnu', 15),
  })
}

function unitPrice(r: MissionRow): number {
  if (r.price_eur != null) return Number(r.price_eur)
  if (r.price_min_eur != null && r.price_max_eur != null) {
    return (Number(r.price_min_eur) + Number(r.price_max_eur)) / 2
  }
  return 0
}

function groupAndSort(
  rows: MissionRow[],
  keyFn: (r: MissionRow) => string,
  limit: number,
): BreakdownRow[] {
  const map = new Map<string, { count: number; caEur: number; accepted: number }>()
  for (const r of rows) {
    const k = keyFn(r)
    const b = map.get(k) ?? { count: 0, caEur: 0, accepted: 0 }
    b.count += 1
    b.caEur += unitPrice(r)
    if (r.accepted_at) b.accepted += 1
    map.set(k, b)
  }
  return Array.from(map.entries())
    .map(([key, v]) => ({
      key,
      count:       v.count,
      caEur:       v.caEur,
      acceptedPct: v.count > 0 ? Math.round((v.accepted / v.count) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}
