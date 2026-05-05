import { createClient } from '@/lib/supabase/client'

export interface MarketplaceCourse {
  id: string
  type: string
  scheduled_at: string
  scheduled_label: string
  departure: string
  destination: string
  price_eur: number | null
  patient_name: string | null
  visibility: 'PUBLIC' | 'GROUP'
  shared_by_name: string
  group_names: string[]
}

interface MissionRow {
  id: string; type: string; scheduled_at: string; departure: string; destination: string
  price_eur: number | null; patient_name: string | null; visibility: 'PUBLIC' | 'GROUP'
  shared_by: string | null; status: string
}

export const patronMarketplaceService = {
  async getMarketplace(driverId: string): Promise<MarketplaceCourse[]> {
    const supabase = createClient()
    const nowIso = new Date().toISOString()

    const { data: memberships } = await supabase
      .from('group_members').select('group_id').eq('driver_id', driverId)
    const myGroupIds = (memberships ?? []).map((m) => m.group_id)

    const [pubRes, grpRes] = await Promise.all([
      supabase.from('missions')
        .select('id, type, scheduled_at, departure, destination, price_eur, patient_name, visibility, shared_by, status')
        .eq('status', 'AVAILABLE').eq('visibility', 'PUBLIC').gt('scheduled_at', nowIso),
      myGroupIds.length === 0
        ? Promise.resolve({ data: [] as { mission_id: string; missions: MissionRow }[] })
        : supabase.from('mission_groups')
            .select('mission_id, missions!inner(id, type, scheduled_at, departure, destination, price_eur, patient_name, visibility, shared_by, status)')
            .in('group_id', myGroupIds),
    ])

    const all = new Map<string, MissionRow>()
    for (const m of (pubRes.data ?? []) as MissionRow[]) all.set(m.id, m)
    for (const r of (grpRes.data ?? []) as { mission_id: string; missions: MissionRow }[]) {
      const m = r.missions
      if (m && m.status === 'AVAILABLE' && new Date(m.scheduled_at) > new Date(nowIso)) {
        all.set(m.id, m)
      }
    }

    const missions = Array.from(all.values())
    if (missions.length === 0) return []

    const sharerIds = Array.from(new Set(missions.map((m) => m.shared_by).filter((id): id is string => !!id)))
    const sharerNames: Record<string, string> = {}
    if (sharerIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name').in('id', sharerIds)
      for (const p of (profiles ?? [])) {
        sharerNames[p.id] = `${(p.first_name?.[0] ?? '?')}. ${p.last_name ?? ''}`.trim()
      }
    }

    const missionIds = missions.map((m) => m.id)
    const groupNamesByMission: Record<string, string[]> = {}
    const { data: mgRows } = await supabase
      .from('mission_groups').select('mission_id, groups(name)').in('mission_id', missionIds)
    for (const r of (mgRows ?? []) as { mission_id: string; groups: { name: string } | null }[]) {
      const arr = groupNamesByMission[r.mission_id] ?? []
      if (r.groups?.name) arr.push(r.groups.name)
      groupNamesByMission[r.mission_id] = arr
    }

    return missions
      .map((m) => ({
        id: m.id, type: m.type, scheduled_at: m.scheduled_at,
        scheduled_label: relativeTime(m.scheduled_at),
        departure: m.departure, destination: m.destination,
        price_eur: m.price_eur, patient_name: m.patient_name,
        visibility: m.visibility,
        shared_by_name: m.shared_by ? sharerNames[m.shared_by] ?? 'Chauffeur' : 'Client',
        group_names: groupNamesByMission[m.id] ?? [],
      }))
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
  },
}

function relativeTime(iso: string): string {
  const target = new Date(iso).getTime()
  const diffMin = Math.round((target - Date.now()) / 60000)
  if (diffMin < 60) return `Dans ${diffMin} min`
  if (diffMin < 24 * 60) return `Dans ${Math.round(diffMin / 60)}h`
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}
