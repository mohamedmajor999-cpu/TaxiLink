import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/adminAuth'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

interface UpsertBody {
  periodMonth:  string                       // 'YYYY-MM' ou 'YYYY-MM-DD'
  service:      string
  costUsd:      number
  requestCount?: number | null
  notes?:        string | null
}

export async function GET() {
  const auth = await assertAdmin()
  if (!auth.ok) return auth.response

  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('google_api_costs')
    .select('id, period_month, service, cost_usd, request_count, notes, updated_at')
    .order('period_month', { ascending: false })
    .order('service',      { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await assertAdmin()
  if (!auth.ok) return auth.response

  let body: UpsertBody
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Requête invalide' }, { status: 400 }) }

  const periodIso = normalizeMonth(body.periodMonth)
  const service = body.service?.trim().toLowerCase()
  const costUsd = Number(body.costUsd)
  if (!periodIso || !service || !Number.isFinite(costUsd) || costUsd < 0) {
    return NextResponse.json({ error: 'Période, service ou coût invalide' }, { status: 422 })
  }

  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('google_api_costs')
    .upsert(
      {
        period_month:  periodIso,
        service,
        cost_usd:      costUsd,
        request_count: body.requestCount ?? null,
        notes:         body.notes ?? null,
      },
      { onConflict: 'period_month,service' }
    )
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function DELETE(request: Request) {
  const auth = await assertAdmin()
  if (!auth.ok) return auth.response

  const idParam = new URL(request.url).searchParams.get('id')
  const id = Number(idParam)
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'id manquant' }, { status: 400 })

  const supabase = createAdminSupabaseClient()
  const { error } = await supabase.from('google_api_costs').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

function normalizeMonth(input: string): string | null {
  if (!input) return null
  if (/^\d{4}-\d{2}$/.test(input))     return `${input}-01`
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [y, m] = input.split('-')
    return `${y}-${m}-01`
  }
  return null
}
