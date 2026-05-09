import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const ONLINE_TTL_MS = 120_000

function isFreshlyOnline(isOnline: boolean | null | undefined, lastSeenAt: string | null | undefined): boolean {
  if (!isOnline || !lastSeenAt) return false
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_TTL_MS
}

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

  /**
   * Pulse global agrégé sur plusieurs groupes (pour le bandeau noir de la
   * liste). Déduplique : un chauffeur présent dans 2 groupes ne compte que
   * pour 1, idem pour une mission partagée à plusieurs groupes.
   * Sans ça, la somme naïve `Σ summary.onlineCount` compte chaque chauffeur
   * une fois par groupe — bug dès qu'un confrère partage 2 groupes.
   */
  async getGlobalPulse(groupIds: string[]): Promise<{ availableTotal: number; onlineTotal: number }> {
    if (groupIds.length === 0) return { availableTotal: 0, onlineTotal: 0 }
    const [onlineRes, availableRes] = await Promise.all([
      supabase.from('group_members')
        .select('driver_id, drivers(is_online, last_seen_at)')
        .in('group_id', groupIds),
      supabase.from('mission_groups')
        .select('mission_id, missions!inner(status)')
        .in('group_id', groupIds)
        .eq('missions.status', 'AVAILABLE'),
    ])
    const onlineDrivers = new Set<string>()
    for (const r of (onlineRes.data ?? []) as Array<{ driver_id: string; drivers: { is_online: boolean | null; last_seen_at: string | null } | null }>) {
      if (isFreshlyOnline(r.drivers?.is_online, r.drivers?.last_seen_at)) onlineDrivers.add(r.driver_id)
    }
    const missions = new Set<string>()
    for (const r of (availableRes.data ?? []) as Array<{ mission_id: string }>) {
      if (r.mission_id) missions.add(r.mission_id)
    }
    return { availableTotal: missions.size, onlineTotal: onlineDrivers.size }
  },
}
