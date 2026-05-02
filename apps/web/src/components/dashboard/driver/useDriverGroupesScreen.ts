import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { groupStatsService, type GroupActivitySummary } from '@/services/groupStatsService'
import type { Group } from '@taxilink/core'
import { useDriverGroupes } from './useDriverGroupes'
import { useGroupFavorites } from './useGroupFavorites'
import { useGroupsLastVisited } from './useGroupsLastVisited'

const REFRESH_DEBOUNCE_MS = 600

export type SortMode = 'activity' | 'recent' | 'name'

export function useDriverGroupesScreen() {
  const groupes = useDriverGroupes()
  const router = useRouter()
  const fav = useGroupFavorites()
  const visited = useGroupsLastVisited()
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('activity')
  const [summaries, setSummaries] = useState<Record<string, GroupActivitySummary>>({})

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groupes.groups
    return groupes.groups.filter((g) =>
      g.name.toLowerCase().includes(q) ||
      (g.description ?? '').toLowerCase().includes(q)
    )
  }, [groupes.groups, query])

  // Le « hero » de la liste = 1er favori. Si le favori a été quitté, on
  // tombe au suivant. S'il n'y a aucun favori valide, pas de hero (sentinelle).
  const primaryGroup = useMemo<Group | null>(() => {
    for (const id of fav.ids) {
      const g = groupes.groups.find((x) => x.id === id)
      if (g) return g
    }
    return null
  }, [fav.ids, groupes.groups])

  const primarySummary = primaryGroup ? summaries[primaryGroup.id] ?? null : null

  // Tri : activité (par défaut) prend "courses dispo desc, puis en ligne desc",
  // récent = ordre de la DB (createdAt desc), name = alpha.
  // Le primaryGroup est exclu car il est déjà rendu en hero.
  const sortedGroups = useMemo<Group[]>(() => {
    const list = filteredGroups.filter((g) => !primaryGroup || g.id !== primaryGroup.id)
    if (sortMode === 'name') {
      return [...list].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    }
    if (sortMode === 'recent') return list
    return [...list].sort((a, b) => {
      const sa = summaries[a.id]; const sb = summaries[b.id]
      const va = (sa?.available ?? 0) * 1000 + (sa?.onlineCount ?? 0)
      const vb = (sb?.available ?? 0) * 1000 + (sb?.onlineCount ?? 0)
      return vb - va
    })
  }, [filteredGroups, primaryGroup, sortMode, summaries])

  // Bandeau noir « X courses · Y en ligne » — somme sur tous les groupes du chauffeur.
  const globalPulse = useMemo(() => {
    let availableTotal = 0
    let onlineTotal = 0
    for (const g of groupes.groups) {
      const s = summaries[g.id]
      if (!s) continue
      availableTotal += s.available
      onlineTotal += s.onlineCount
    }
    return { availableTotal, onlineTotal }
  }, [groupes.groups, summaries])

  // Pastille « nouveau » par groupe : true si lastEventAt > lastVisited.
  const hasNews = useCallback((g: Group): boolean => {
    const s = summaries[g.id]
    return visited.isNewSinceVisit(g.id, s?.lastEventAt ?? null)
  }, [summaries, visited])

  // Coût : 1 requête Supabase par groupe (on parallélise). Acceptable jusqu'à ~10 groupes.
  const loadSummaries = useCallback(async (groupList: Group[]) => {
    if (groupList.length === 0) { setSummaries({}); return }
    const results = await Promise.allSettled(
      groupList.map((g) => groupStatsService.getActivitySummary(g.id).then((s) => [g.id, s] as const))
    )
    const next: Record<string, GroupActivitySummary> = {}
    for (const r of results) {
      if (r.status === 'fulfilled') {
        const [id, s] = r.value
        next[id] = s
      }
    }
    setSummaries(next)
  }, [])

  useEffect(() => {
    let cancelled = false
    loadSummaries(groupes.groups).then(() => { if (cancelled) return })
    return () => { cancelled = true }
  }, [groupes.groups, loadSummaries])

  // Real-time : refetch des summaries dès qu'une mission entre/sort/change dans
  // un groupe du chauffeur. Sans ça, les compteurs étaient un snapshot HTTP figé.
  // Stratégie : un seul canal par user, debounce 600ms côté client.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (groupes.groups.length === 0) return
    const myGroupIds = new Set(groupes.groups.map((g) => g.id))
    const supabase = createClient()
    const trigger = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => loadSummaries(groupes.groups), REFRESH_DEBOUNCE_MS)
    }
    const channel = supabase
      .channel('groupes-summary-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mission_groups' }, (payload: any) => {
        const gid = payload.new?.group_id ?? payload.old?.group_id
        if (gid && myGroupIds.has(gid)) trigger()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'missions' }, () => trigger())
      .subscribe()
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      supabase.removeChannel(channel)
    }
  }, [groupes.groups, loadSummaries])

  const openGroup = (group: Group) => {
    router.push(`/dashboard/chauffeur/groupe/${group.id}`)
  }

  return {
    ...groupes,
    query, setQuery,
    sortMode, setSortMode,
    filteredGroups,
    primaryGroup,
    primarySummary,
    sortedGroups,
    globalPulse,
    summaries,
    favorites: fav,
    hasNews,
    openGroup,
  }
}
