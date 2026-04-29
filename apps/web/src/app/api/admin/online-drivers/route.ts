import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/adminAuth'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

interface DriverRow {
  id:                            string
  current_lat:                   number | null
  current_lng:                   number | null
  current_position_updated_at:   string | null
}

interface ProfileRow {
  id:         string
  first_name: string | null
  last_name:  string | null
  phone:      string | null
}

export interface OnlineDriver {
  userId:     string
  name:       string
  phone:      string | null
  lat:        number
  lng:        number
  updatedAt:  string
}

const POSITION_TTL_MS = 5 * 60 * 1000

export async function GET() {
  const auth = await assertAdmin()
  if (!auth.ok) return auth.response

  const supabase = createAdminSupabaseClient()
  const cutoff = new Date(Date.now() - POSITION_TTL_MS).toISOString()

  const { data: drivers, error } = await supabase
    .from('drivers')
    .select('id, current_lat, current_lng, current_position_updated_at')
    .eq('is_online', true)
    .not('current_lat', 'is', null)
    .not('current_lng', 'is', null)
    .gte('current_position_updated_at', cutoff)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const list = (drivers ?? []) as DriverRow[]
  if (list.length === 0) return NextResponse.json({ items: [] })

  const ids = list.map((d) => d.id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, phone')
    .in('id', ids)

  const profById = new Map(((profiles ?? []) as ProfileRow[]).map((p) => [p.id, p]))

  const items: OnlineDriver[] = list
    .filter((d): d is DriverRow & { current_lat: number; current_lng: number; current_position_updated_at: string } =>
      d.current_lat != null && d.current_lng != null && d.current_position_updated_at != null
    )
    .map((d) => {
      const p = profById.get(d.id)
      return {
        userId:    d.id,
        name:      `${p?.first_name ?? ''} ${p?.last_name ?? ''}`.trim() || 'Sans nom',
        phone:     p?.phone ?? null,
        lat:       Number(d.current_lat),
        lng:       Number(d.current_lng),
        updatedAt: d.current_position_updated_at,
      }
    })

  return NextResponse.json({ items })
}
