import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { groupStatsService, type GroupActivitySummary } from '@/services/groupStatsService'
import type { Group } from '@taxilink/core'
import { useDriverGroupes } from './useDriverGroupes'

const PIN_KEY = 'taxilink:driver:pinnedGroupId'

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
  useEffect(() => {
    if (groupes.groups.length === 0) { setSummaries({}); return }
    let cancelled = false
    Promise.allSettled(
      groupes.groups.map((g) => groupStatsService.getActivitySummary(g.id).then((s) => [g.id, s] as const))
    ).then((results) => {
      if (cancelled) return
      const next: Record<string, GroupActivitySummary> = {}
      for (const r of results) {
        if (r.status === 'fulfilled') {
          const [id, s] = r.value
          next[id] = s
        }
      }
      setSummaries(next)
    })
    return () => { cancelled = true }
  }, [groupes.groups])

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
