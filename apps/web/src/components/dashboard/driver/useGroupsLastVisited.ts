import { useCallback, useEffect, useState } from 'react'

const KEY = 'taxilink:driver:groupsLastVisited'
const EVT = 'taxilink:groups-visited-changed'

type Map = Record<string, string>  // groupId -> ISO date

function load(): Map {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return {}
    const obj = JSON.parse(raw)
    return obj && typeof obj === 'object' ? obj as Map : {}
  } catch { return {} }
}

function persist(m: Map) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(m))
    window.dispatchEvent(new CustomEvent(EVT))
  } catch { /* noop */ }
}

// Track de la derniere visite d'un groupe — utilise pour decider d'afficher
// la pastille jaune "nouveau" sur la carte. On ecrit `markVisited` au moment
// ou le chauffeur ouvre le detail (cf. useGroupDetail.load).
export function useGroupsLastVisited() {
  const [map, setMap] = useState<Map>({})

  useEffect(() => {
    setMap(load())
    const sync = () => setMap(load())
    window.addEventListener('storage', sync)
    window.addEventListener(EVT, sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(EVT, sync)
    }
  }, [])

  const markVisited = useCallback((groupId: string) => {
    const next = { ...load(), [groupId]: new Date().toISOString() }
    persist(next)
    setMap(next)
  }, [])

  const isNewSinceVisit = useCallback((groupId: string, lastEventAt: string | null): boolean => {
    if (!lastEventAt) return false
    const visited = map[groupId]
    if (!visited) return true   // jamais visite + il y a eu un event = nouveau
    return lastEventAt > visited
  }, [map])

  return { markVisited, isNewSinceVisit }
}
