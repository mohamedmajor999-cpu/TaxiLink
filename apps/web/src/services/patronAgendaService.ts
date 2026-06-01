import { createClient } from '@/lib/supabase/client'
import { endOfDay, fromDayIso, missionStatus, shortenLabel, startOfDay } from './patronAgendaHelpers'

export interface AgendaBlock {
  id: string
  startH: number     // heure decimale (ex: 14.5 pour 14h30)
  endH: number
  label: string
  type: string       // CPAM / PRIVE
  status: 'completed' | 'in-progress' | 'planned'
}

export interface AgendaDriverRow {
  driverId: string
  name: string
  blocks: AgendaBlock[]
}

export interface UnassignedCourse {
  id: string
  type: string
  startH: number
  endH: number
  scheduled_at: string
  departure: string
  destination: string
  departure_lat: number | null
  departure_lng: number | null
  price_eur: number | null
  patient_name: string | null
}

export interface DaySchedule {
  drivers: AgendaDriverRow[]
  unassigned: UnassignedCourse[]
}

export const patronAgendaService = {
  // Renvoie le planning du jour : missions affectees par chauffeur + missions
  // AVAILABLE non assignees du meme jour (a dispatcher).
  async getDaySchedules(orgId: string, dayIso?: string): Promise<DaySchedule> {
    const supabase = createClient()
    const day = dayIso ? fromDayIso(dayIso) : new Date()
    const dayStart = startOfDay(day).toISOString()
    const dayEnd = endOfDay(day).toISOString()

    const { data: drivers, error: dErr } = await supabase
      .from('drivers')
      .select('id, profiles!inner(first_name, last_name)')
      .eq('organization_id', orgId)
    if (dErr) throw new Error(dErr.message)

    if (!drivers || drivers.length === 0) {
      return { drivers: [], unassigned: [] }
    }

    const driverIds = drivers.map((d) => d.id)

    const [assignedRes, unassignedRes] = await Promise.all([
      supabase
        .from('missions')
        .select('id, driver_id, scheduled_at, duration_min, status, departure, destination, type, completed_at')
        .in('driver_id', driverIds)
        .gte('scheduled_at', dayStart)
        .lte('scheduled_at', dayEnd),
      // PII patient (patient_name) des courses dispo non assignees : passe par le
      // RPC masque get_org_unassigned_missions (SECURITY DEFINER, verifie que
      // l'appelant appartient bien a l'org). Prerequis au resserrement de la policy
      // RLS SELECT missions (audit H-01). Le RPC trie deja par scheduled_at ASC.
      // @ts-expect-error RPC absent des types Supabase generes (cf. getByIdMasked)
      supabase.rpc('get_org_unassigned_missions', {
        p_org_id: orgId,
        p_day_start: dayStart,
        p_day_end: dayEnd,
      }),
    ])
    if (assignedRes.error) throw new Error(assignedRes.error.message)
    if (unassignedRes.error) throw new Error(unassignedRes.error.message)

    const driverRows: AgendaDriverRow[] = drivers.map((d) => {
      const profile = d.profiles as unknown as { first_name: string | null; last_name: string | null }
      const name = `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || 'Chauffeur'
      const myMissions = (assignedRes.data ?? []).filter((m) => m.driver_id === d.id)

      const blocks: AgendaBlock[] = myMissions.map((m) => {
        const start = new Date(m.scheduled_at)
        const startH = start.getHours() + start.getMinutes() / 60
        const durationH = (m.duration_min ?? 30) / 60
        return {
          id: m.id,
          startH,
          endH: Math.min(24, startH + durationH),
          label: shortenLabel(m.departure, m.destination),
          type: m.type,
          status: missionStatus(m.status, m.completed_at),
        }
      })

      return { driverId: d.id, name, blocks }
    })

    type UnassignedRpcRow = {
      id: string; scheduled_at: string; duration_min: number | null
      departure: string; destination: string; type: string
      price_eur: number | null; patient_name: string | null
      departure_lat: number | null; departure_lng: number | null
    }
    const unassignedRows = (unassignedRes.data ?? []) as UnassignedRpcRow[]
    const unassigned: UnassignedCourse[] = unassignedRows.map((m) => {
      const start = new Date(m.scheduled_at)
      const startH = start.getHours() + start.getMinutes() / 60
      const durationH = (m.duration_min ?? 30) / 60
      return {
        id: m.id,
        type: m.type,
        startH,
        endH: Math.min(24, startH + durationH),
        scheduled_at: m.scheduled_at,
        departure: m.departure,
        destination: m.destination,
        departure_lat: m.departure_lat == null ? null : Number(m.departure_lat),
        departure_lng: m.departure_lng == null ? null : Number(m.departure_lng),
        price_eur: m.price_eur,
        patient_name: m.patient_name,
      }
    })

    return { drivers: driverRows, unassigned }
  },
}
