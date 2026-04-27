import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { groupStatsService, type GroupActivitySummary } from '@/services/groupStatsService'
import type { Group } from '@taxilink/core'
import { useDriverGroupes } from './useDriverGroupes'

const PIN_KEY = 'taxilink:driver:pinnedGroupId'
const REFRESH_DEBOUNCE_MS = 600

function loadPin(): string | null {
  if (typeof window === 'undefined') return null
  try { return window.localStorage.getItem(PIN_KEY) } catch { return null }
}

export function useDriverGroupesScreen() {
  const groupes = useDriverGroupes()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [pinnedId, setPinnedId] = useState<string | null>(null)
  const [summaries, setSummaries] = useState<Record<string, GroupActivitySummary>>({})

  useEffect(() => { setPinnedId(loadPin()) }, [])

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groupes.groups
    return groupes.groups.filter((g) =>
      g.name.toLowerCase().includes(q) ||
      (g.description ?? '').toLowerCase().includes(q)
    )
  }, [groupes.groups, query])

  // L'actif n'est plus le premier de la liste (UX trompeuse) : c'est le pin user.
  // Si le pin pointe sur un groupe quitté, on ne le force pas — l'écran reste sans actif.
  const activeGroupId = pinnedId && groupes.groups.some((g) => g.id === pinnedId) ? pinnedId : null
  const activeSummary = activeGroupId ? summaries[activeGroupId] ?? null : null

  // Pastille de vie sur chaque carte : on charge tous les summaries en parallèle.
  // Coût : 3 requêtes Supabase par groupe. Acceptable jusqu'à ~10 groupes/chauffeur.
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

  // Real-time : refetch les summaries dès qu'une mission entre/sort/change dans un
  // groupe du chauffeur. Sans ça les compteurs « N courses dispo » étaient un
  // snapshot HTTP figé au mount — plus de signal que la page est vivante.
  // Stratégie : un seul canal par user, debounce 600ms côté client. Le filtre
  // « group_id IN myGroups » ne s'exprime pas dans Supabase realtime — on filtre
  // donc côté client.
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

  const togglePin = (groupId: string) => {
    const next = pinnedId === groupId ? null : groupId
    setPinnedId(next)
    try {
      if (next) window.localStorage.setItem(PIN_KEY, next)
      else window.localStorage.removeItem(PIN_KEY)
    } catch { /* noop */ }
  }

  const openGroup = (group: Group) => {
    router.push(`/dashboard/chauffeur/groupe/${group.id}`)
  }

  return {
    ...groupes,
    query, setQuery,
    filteredGroups,
    activeGroupId,
    activeSummary,
    summaries,
    togglePin,
    openGroup,
  }
}
