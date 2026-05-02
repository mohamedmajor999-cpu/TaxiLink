import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/adminAuth'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

interface MissionRow {
  id:                   string
  type:                 string | null
  status:               string
  scheduled_at:         string
  patient_name:         string | null
  driver_id:            string | null
  enroute_at:           string | null
  arrived_at_pickup_at: string | null
  pickup_at:            string | null
  arrived_at_dest_at:   string | null
  dropoff_at:           string | null
  completed_at:         string | null
}

interface DriverRow { id: string; full_name: string | null }

export async function GET() {
  const auth = await assertAdmin()
  if (!auth.ok) return auth.response

  const supabase = createAdminSupabaseClient()
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('missions')
    .select('id, type, status, scheduled_at, patient_name, driver_id, enroute_at, arrived_at_pickup_at, pickup_at, arrived_at_dest_at, dropoff_at, completed_at')
    .gte('scheduled_at', since)
    .not('driver_id', 'is', null)
    .order('scheduled_at', { ascending: false })
    .limit(500)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []) as MissionRow[]
  const driverIds = Array.from(new Set(rows.map((r) => r.driver_id).filter((x): x is string => !!x)))
  const driverMap = new Map<string, string>()
  if (driverIds.length > 0) {
    const { data: drivers } = await supabase.from('drivers').select('id, full_name').in('id', driverIds)
    for (const d of (drivers ?? []) as DriverRow[]) driverMap.set(d.id, d.full_name ?? '—')
  }

  return NextResponse.json({
    counters: counters(rows),
    recent:   rows.slice(0, 30).map((r) => ({
      id: r.id,
      type: r.type,
      scheduledAt: r.scheduled_at,
      patientName: r.patient_name,
      driverName: r.driver_id ? (driverMap.get(r.driver_id) ?? '—') : '—',
      flags: {
        enroute:        Boolean(r.enroute_at),
        arrivedPickup:  Boolean(r.arrived_at_pickup_at),
        pickup:         Boolean(r.pickup_at),
        arrivedDest:    Boolean(r.arrived_at_dest_at),
        dropoff:        Boolean(r.dropoff_at),
        completed:      Boolean(r.completed_at),
      },
    })),
  })
}

function counters(rows: MissionRow[]) {
  let total = 0, fullAuto = 0, partialAuto = 0, noAuto = 0
  let waitPickupSum = 0, waitPickupN = 0
  let waitDestSum = 0, waitDestN = 0
  for (const r of rows) {
    total += 1
    const hasArrPickup = Boolean(r.arrived_at_pickup_at)
    const hasArrDest = Boolean(r.arrived_at_dest_at)
    if (hasArrPickup && hasArrDest) fullAuto += 1
    else if (hasArrPickup || hasArrDest) partialAuto += 1
    else noAuto += 1

    if (r.arrived_at_pickup_at && r.pickup_at) {
      const dt = (new Date(r.pickup_at).getTime() - new Date(r.arrived_at_pickup_at).getTime()) / 1000 / 60
      if (dt >= 0 && dt < 60) { waitPickupSum += dt; waitPickupN += 1 }
    }
    if (r.arrived_at_dest_at && r.dropoff_at) {
      const dt = (new Date(r.dropoff_at).getTime() - new Date(r.arrived_at_dest_at).getTime()) / 1000 / 60
      if (dt >= 0 && dt < 60) { waitDestSum += dt; waitDestN += 1 }
    }
  }
  return {
    total,
    fullAuto,
    partialAuto,
    noAuto,
    fullAutoPct:    total > 0 ? Math.round((fullAuto    / total) * 100) : 0,
    partialAutoPct: total > 0 ? Math.round((partialAuto / total) * 100) : 0,
    noAutoPct:      total > 0 ? Math.round((noAuto      / total) * 100) : 0,
    avgWaitPickupMin: waitPickupN > 0 ? Math.round((waitPickupSum / waitPickupN) * 10) / 10 : null,
    avgWaitDestMin:   waitDestN   > 0 ? Math.round((waitDestSum   / waitDestN)   * 10) / 10 : null,
  }
}
