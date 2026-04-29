import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/adminAuth'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

interface UsageRow {
  user_id:       string | null
  endpoint:      string
  model:         string
  input_tokens:  number
  output_tokens: number
  cost_usd:      number
  created_at:    string
}

interface ProfileRow {
  id:         string
  first_name: string | null
  last_name:  string | null
}

interface PeriodBucket {
  period:   string
  requests: number
  costUsd:  number
}

interface TopUser {
  userId:    string | null
  name:      string
  requests:  number
  costUsd:   number
}

export async function GET() {
  const auth = await assertAdmin()
  if (!auth.ok) return auth.response

  const supabase = createAdminSupabaseClient()
  const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
  const { data: rows, error } = await supabase
    .from('ai_usage')
    .select('user_id, endpoint, model, input_tokens, output_tokens, cost_usd, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const usage = (rows ?? []) as UsageRow[]

  const userIds = Array.from(new Set(usage.map((r) => r.user_id).filter((id): id is string => !!id)))
  let profiles: ProfileRow[] = []
  if (userIds.length > 0) {
    const { data } = await supabase.from('profiles').select('id, first_name, last_name').in('id', userIds)
    profiles = (data ?? []) as ProfileRow[]
  }
  const nameById = new Map(
    profiles.map((p) => [p.id, `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Sans nom'])
  )

  return NextResponse.json({
    daily:   bucketize(usage, dayKey,   30),
    weekly:  bucketize(usage, weekKey,  12),
    monthly: bucketize(usage, monthKey, 12),
    topUsers: topUsers(usage, nameById, 10),
    totals:  totals(usage),
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

function bucketize(rows: UsageRow[], keyFn: (iso: string) => string, limit: number): PeriodBucket[] {
  const map = new Map<string, PeriodBucket>()
  for (const r of rows) {
    const k = keyFn(r.created_at)
    const b = map.get(k) ?? { period: k, requests: 0, costUsd: 0 }
    b.requests += 1
    b.costUsd  += Number(r.cost_usd)
    map.set(k, b)
  }
  return Array.from(map.values()).sort((a, b) => b.period.localeCompare(a.period)).slice(0, limit)
}

function topUsers(rows: UsageRow[], nameById: Map<string, string>, limit: number): TopUser[] {
  const map = new Map<string, TopUser>()
  for (const r of rows) {
    const k = r.user_id ?? '__anon__'
    const t = map.get(k) ?? { userId: r.user_id, name: nameById.get(r.user_id ?? '') ?? 'Anonyme', requests: 0, costUsd: 0 }
    t.requests += 1
    t.costUsd  += Number(r.cost_usd)
    map.set(k, t)
  }
  return Array.from(map.values()).sort((a, b) => b.costUsd - a.costUsd).slice(0, limit)
}

function totals(rows: UsageRow[]) {
  const total = rows.reduce(
    (acc, r) => {
      acc.requests += 1
      acc.costUsd  += Number(r.cost_usd)
      acc.inputTokens  += r.input_tokens
      acc.outputTokens += r.output_tokens
      return acc
    },
    { requests: 0, costUsd: 0, inputTokens: 0, outputTokens: 0 }
  )
  return total
}
