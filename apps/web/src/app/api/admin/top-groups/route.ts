import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/adminAuth'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

interface GroupRow      { id: string; name: string; description: string | null; created_at: string }
interface MemberRow     { group_id: string; driver_id: string; joined_at: string }
interface MissionGroupRow { mission_id: string; group_id: string; created_at: string }
interface MissionRow    { id: string; created_at: string; accepted_at: string | null }

export interface GroupRanking {
  groupId:         string
  name:            string
  description:     string | null
  members:         number
  missionsTotal:   number
  missions30d:     number
  acceptanceRate:  number
  lastMissionAt:   string | null
}

export async function GET() {
  const auth = await assertAdmin()
  if (!auth.ok) return auth.response

  const supabase = createAdminSupabaseClient()

  const [groupsRes, membersRes, mgRes, missionsRes] = await Promise.all([
    supabase.from('groups').select('id, name, description, created_at'),
    supabase.from('group_members').select('group_id, driver_id, joined_at'),
    supabase.from('mission_groups').select('mission_id, group_id, created_at'),
    supabase.from('missions').select('id, created_at, accepted_at'),
  ])

  if (groupsRes.error)   return NextResponse.json({ error: groupsRes.error.message },   { status: 500 })
  if (membersRes.error)  return NextResponse.json({ error: membersRes.error.message },  { status: 500 })
  if (mgRes.error)       return NextResponse.json({ error: mgRes.error.message },       { status: 500 })
  if (missionsRes.error) return NextResponse.json({ error: missionsRes.error.message }, { status: 500 })

  const groups   = (groupsRes.data   ?? []) as GroupRow[]
  const members  = (membersRes.data  ?? []) as MemberRow[]
  const missGrp  = (mgRes.data       ?? []) as MissionGroupRow[]
  const missions = (missionsRes.data ?? []) as MissionRow[]

  const missionById = new Map(missions.map((m) => [m.id, m]))
  const memberCountByGroup = new Map<string, number>()
  for (const m of members) memberCountByGroup.set(m.group_id, (memberCountByGroup.get(m.group_id) ?? 0) + 1)

  const cutoff30d = Date.now() - 30 * 24 * 60 * 60 * 1000

  const ranking: GroupRanking[] = groups.map((g) => {
    const links = missGrp.filter((mg) => mg.group_id === g.id)
    let missionsTotal = 0
    let missions30d   = 0
    let accepted      = 0
    let lastAt: number | null = null

    for (const link of links) {
      const m = missionById.get(link.mission_id)
      if (!m) continue
      missionsTotal += 1
      const t = new Date(m.created_at).getTime()
      if (t > cutoff30d) missions30d += 1
      if (m.accepted_at) accepted += 1
      if (lastAt == null || t > lastAt) lastAt = t
    }

    return {
      groupId:        g.id,
      name:           g.name,
      description:    g.description,
      members:        memberCountByGroup.get(g.id) ?? 0,
      missionsTotal,
      missions30d,
      acceptanceRate: missionsTotal > 0 ? Math.round((accepted / missionsTotal) * 100) : 0,
      lastMissionAt:  lastAt != null ? new Date(lastAt).toISOString() : null,
    }
  })

  ranking.sort((a, b) => b.missions30d - a.missions30d)

  return NextResponse.json({
    items: ranking,
    counters: {
      totalGroups:    groups.length,
      activeGroups30d: ranking.filter((r) => r.missions30d > 0).length,
      totalMembers:   members.length,
    },
  })
}
