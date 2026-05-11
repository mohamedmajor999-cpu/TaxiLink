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

interface RpcRow {
  id: string
  type: string
  scheduled_at: string
  departure: string
  destination: string
  price_eur: number | null
  patient_name: string | null  // deja masque (initiales) cote SQL
  visibility: 'PUBLIC' | 'GROUP'
  shared_by: string | null
  mission_groups: { group_id: string }[]
}

export const patronMarketplaceService = {
  // Marketplace patron : passe par get_marketplace_missions (RPC SECURITY
  // INVOKER) qui applique mask_initials sur patient_name et NULL sur phone/notes.
  // Sans ca, un patron voyait les noms patients en clair des missions partagees
  // par d'autres orgs — bug RGPD (cf. 20260504_marketplace_masked_rpc.sql).
  // Le param driverId reste pour compat de signature mais n'est plus utilise :
  // le RPC s'appuie sur auth.uid() + RLS pour scope la visibilite.
  async getMarketplace(_driverId: string): Promise<MarketplaceCourse[]> {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('get_marketplace_missions', {
      p_departments: undefined,
      p_limit: 100,
    })
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as unknown as RpcRow[]
    if (rows.length === 0) return []

    // Enrichissement : nom du sharer (initiales) + noms des groupes.
    const sharerIds = Array.from(new Set(rows.map((r) => r.shared_by).filter((id): id is string => !!id)))
    const groupIds = Array.from(new Set(rows.flatMap((r) => (r.mission_groups ?? []).map((g) => g.group_id))))

    const [profilesRes, groupsRes] = await Promise.all([
      sharerIds.length > 0
        ? supabase.from('profiles').select('id, first_name, last_name').in('id', sharerIds)
        : Promise.resolve({ data: [] as Array<{ id: string; first_name: string | null; last_name: string | null }> }),
      groupIds.length > 0
        ? supabase.from('groups').select('id, name').in('id', groupIds)
        : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    ])
    const sharerNames: Record<string, string> = {}
    for (const p of (profilesRes.data ?? [])) {
      sharerNames[p.id] = `${(p.first_name?.[0] ?? '?')}. ${p.last_name ?? ''}`.trim()
    }
    const groupNames: Record<string, string> = {}
    for (const g of (groupsRes.data ?? [])) groupNames[g.id] = g.name

    return rows
      .map((m) => ({
        id: m.id,
        type: m.type,
        scheduled_at: m.scheduled_at,
        scheduled_label: relativeTime(m.scheduled_at),
        departure: m.departure,
        destination: m.destination,
        price_eur: m.price_eur,
        patient_name: m.patient_name,  // deja masque par le RPC
        visibility: m.visibility,
        shared_by_name: m.shared_by ? sharerNames[m.shared_by] ?? 'Chauffeur' : 'Client',
        group_names: (m.mission_groups ?? [])
          .map((g) => groupNames[g.group_id])
          .filter((n): n is string => !!n),
      }))
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
  },
}

function relativeTime(iso: string): string {
  const target = new Date(iso).getTime()
  const diffMin = Math.round((target - Date.now()) / 60000)
  // Mission deja passee : affiche la date absolue plutot que "Dans -X min".
  if (diffMin < 0) {
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
  }
  if (diffMin < 60) return `Dans ${diffMin} min`
  if (diffMin < 24 * 60) return `Dans ${Math.round(diffMin / 60)}h`
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}
