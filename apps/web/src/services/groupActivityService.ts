import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export type GroupActivityKind = 'shared' | 'accepted'

export interface GroupActivityEvent {
  id:          string
  kind:        GroupActivityKind
  driverId:    string
  driverLabel: string
  departure:   string
  destination: string
  at:          string
}

function shortLabel(firstName?: string | null, lastName?: string | null): string {
  if (firstName && lastName) return `${firstName} ${lastName.charAt(0).toUpperCase()}.`
  if (firstName) return firstName
  if (lastName)  return lastName
  return 'Un confrère'
}

function shortAddress(s: string | null | undefined): string {
  if (!s) return ''
  const before = s.split(',')[0]?.trim() ?? s
  return before.length > 28 ? before.slice(0, 28) + '…' : before
}

export const groupActivityService = {
  /**
   * Derniers événements du groupe (partages + acceptations) sur 7j.
   * Renvoie 0–2 events par mission : un « shared » (toujours), et un
   * « accepted » si la course a été reprise. Les events sont triés par
   * date décroissante puis tronqués à `limit`.
   */
  async getRecentEvents(groupId: string, limit = 6): Promise<GroupActivityEvent[]> {
    const since = new Date(Date.now() - 7 * 86_400_000).toISOString()
    const { data, error } = await supabase
      .from('mission_groups')
      .select('missions!inner(id, departure, destination, shared_by, driver_id, created_at, accepted_at)')
      .eq('group_id', groupId)
      .gte('missions.created_at', since)
      .limit(limit * 2)
    if (error) throw new Error(error.message)

    type Row = {
      missions: {
        id: string; departure: string; destination: string;
        shared_by: string | null; driver_id: string | null;
        created_at: string; accepted_at: string | null;
      } | null
    }
    const rows = (data ?? []) as Row[]

    const driverIds = new Set<string>()
    for (const r of rows) {
      if (r.missions?.shared_by) driverIds.add(r.missions.shared_by)
      if (r.missions?.driver_id) driverIds.add(r.missions.driver_id)
    }

    const labels: Record<string, string> = {}
    if (driverIds.size > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', Array.from(driverIds))
      for (const p of (profs ?? []) as Array<{ id: string; first_name: string | null; last_name: string | null }>) {
        labels[p.id] = shortLabel(p.first_name, p.last_name)
      }
    }

    const events: GroupActivityEvent[] = []
    for (const r of rows) {
      const m = r.missions
      if (!m) continue
      const dep = shortAddress(m.departure)
      const dst = shortAddress(m.destination)
      if (m.shared_by) {
        events.push({
          id: `${m.id}-share`, kind: 'shared',
          driverId: m.shared_by, driverLabel: labels[m.shared_by] ?? 'Un confrère',
          departure: dep, destination: dst, at: m.created_at,
        })
      }
      if (m.driver_id && m.accepted_at) {
        events.push({
          id: `${m.id}-accept`, kind: 'accepted',
          driverId: m.driver_id, driverLabel: labels[m.driver_id] ?? 'Un confrère',
          departure: dep, destination: dst, at: m.accepted_at,
        })
      }
    }

    events.sort((a, b) => b.at.localeCompare(a.at))
    return events.slice(0, limit)
  },
}
