import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/adminAuth'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

interface DriverRow {
  id:                            string
  current_lat:                   number | null
  current_lng:                   number | null
  current_position_updated_at:   string | null
  last_seen_at:                  string | null
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
  lat:        number | null
  lng:        number | null
  updatedAt:  string | null
  lastSeenAt: string | null
}

// TTL position : un fix GPS plus vieux que ca est considere "perime" et
// le marker tombe de la carte. Le chauffeur reste dans le listing (en gris)
// tant que is_online=true (heartbeat frais cote DB via cron 180s).
const POSITION_TTL_MS = 5 * 60 * 1000

export async function GET() {
  const auth = await assertAdmin()
  if (!auth.ok) return auth.response

  const supabase = createAdminSupabaseClient()
  const positionCutoff = Date.now() - POSITION_TTL_MS

  // Pas de filtre .not('current_lat') ni .gte('current_position_updated_at') :
  // on remonte TOUS les chauffeurs is_online=true, meme sans fix GPS frais.
  // Le client decide (markers carte vs. liste). Sinon on rate les chauffeurs
  // qui pingent leur heartbeat mais dont le GPS n'a pas encore lock.
  const { data: drivers, error } = await supabase
    .from('drivers')
    .select('id, current_lat, current_lng, current_position_updated_at, last_seen_at')
    .eq('is_online', true)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const list = (drivers ?? []) as DriverRow[]
  if (list.length === 0) return NextResponse.json({ items: [] })

  const ids = list.map((d) => d.id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, phone')
    .in('id', ids)

  const profById = new Map(((profiles ?? []) as ProfileRow[]).map((p) => [p.id, p]))

  const items: OnlineDriver[] = list.map((d) => {
    const p = profById.get(d.id)
    const posTs = d.current_position_updated_at ? new Date(d.current_position_updated_at).getTime() : 0
    const fresh = posTs > 0 && posTs >= positionCutoff
    return {
      userId:     d.id,
      name:       `${p?.first_name ?? ''} ${p?.last_name ?? ''}`.trim() || 'Sans nom',
      phone:      p?.phone ?? null,
      lat:        fresh && d.current_lat != null ? Number(d.current_lat) : null,
      lng:        fresh && d.current_lng != null ? Number(d.current_lng) : null,
      updatedAt:  fresh ? d.current_position_updated_at : null,
      lastSeenAt: d.last_seen_at,
    }
  })

  return NextResponse.json({ items })
}
