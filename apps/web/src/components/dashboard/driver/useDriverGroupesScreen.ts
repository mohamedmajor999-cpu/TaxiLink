import { useMemo, useState } from 'react'
import { useDriverGroupes } from './useDriverGroupes'

export function useDriverGroupesScreen() {
  const groupes = useDriverGroupes()
  const [query, setQuery] = useState('')

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groupes.groups
    return groupes.groups.filter((g) =>
      g.name.toLowerCase().includes(q) ||
      (g.description ?? '').toLowerCase().includes(q)
    )
  }, [groupes.groups, query])

  return { ...groupes, query, setQuery, filteredGroups }
}
