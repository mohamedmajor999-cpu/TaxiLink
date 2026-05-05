import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { groupService } from '@/services/groupService'
import { groupStatsService, type GroupActivitySummary } from '@/services/groupStatsService'
import { groupActivityService } from '@/services/groupActivityService'
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
  const [globalPulse, setGlobalPulse] = useState<{ availableTotal: number; onlineTotal: number }>({ availableTotal: 0, onlineTotal: 0 })

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groupes.groups
    return groupes.groups.filter((g) =>
      g.name.toLowerCase().includes(q) ||
      (g.description ?? '').toLowerCase().includes(q)
    )
  }, [groupes.groups, query])

  // Le « hero » de la liste = 1er favori valide. Fallback sur le 1er groupe
  // si aucun favori : on veut toujours afficher le raccourci « Poster une
  // course » en haut, même pour un chauffeur qui n'a jamais étoilé un groupe
  // (sinon le bandeau « hero » disparaît et la page ne ressemble pas à la
  // maquette).
  const primaryGroup = useMemo<Group | null>(() => {
    for (const id of fav.ids) {
      const g = groupes.groups.find((x) => x.id === id)
      if (g) return g
    }
    return groupes.groups[0] ?? null
  }, [fav.ids, groupes.groups])

  const primarySummary = primaryGroup ? summaries[primaryGroup.id] ?? null : null
  const primaryIsFavorite = primaryGroup ? fav.has(primaryGroup.id) : false

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

  // Pastille « nouveau » par groupe : true si lastEventAt > lastVisited.
  const hasNews = useCallback((g: Group): boolean => {
    const s = summaries[g.id]
    return visited.isNewSinceVisit(g.id, s?.lastEventAt ?? null)
  }, [summaries, visited])

  // Coût : 1 requête Supabase par groupe pour les summaries (parallélisées) +
  // 1 batch query pour le pulse global. Le pulse a sa propre route pour
  // dédupliquer chauffeurs/missions partagés à plusieurs groupes — sans ça
  // un confrère présent dans 2 groupes serait compté 2 fois.
  const loadSummaries = useCallback(async (groupList: Group[]) => {
    if (groupList.length === 0) {
      setSummaries({}); setGlobalPulse({ availableTotal: 0, onlineTotal: 0 }); return
    }
    const ids = groupList.map((g) => g.id)
    const [perGroup, pulse] = await Promise.all([
      Promise.allSettled(
        groupList.map((g) => groupStatsService.getActivitySummary(g.id).then((s) => [g.id, s] as const))
      ),
      groupActivityService.getGlobalPulse(ids).catch(() => ({ availableTotal: 0, onlineTotal: 0 })),
    ])
    const next: Record<string, GroupActivitySummary> = {}
    for (const r of perGroup) {
      if (r.status === 'fulfilled') {
        const [id, s] = r.value
        next[id] = s
      }
    }
    setSummaries(next)
    setGlobalPulse(pulse)
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
    const groupIds = groupes.groups.map((g) => g.id)
    const trigger = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => loadSummaries(groupes.groups), REFRESH_DEBOUNCE_MS)
    }
    const unsubscribe = groupService.subscribeActivity(groupIds, trigger)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      unsubscribe()
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
    primaryIsFavorite,
    sortedGroups,
    globalPulse,
    summaries,
    favorites: fav,
    hasNews,
    openGroup,
  }
}
