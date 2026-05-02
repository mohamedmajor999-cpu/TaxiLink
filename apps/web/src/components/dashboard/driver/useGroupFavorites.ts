import { useCallback, useEffect, useState } from 'react'

const FAV_KEY = 'taxilink:driver:favoriteGroupIds'
const EVT     = 'taxilink:favs-changed'

// Stockage : tableau ordonné (le 1er entré est le « hero » de la liste).
// Choix de l'array vs Set : on a besoin de l'ordre stable pour décider
// quel groupe est promu en hero — Set non-ordonné en pratique.
function load(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(FAV_KEY)
    if (!raw) {
      // Fallback : migration depuis l'ancien pin unique (taxilink:driver:pinnedGroupId)
      const legacy = window.localStorage.getItem('taxilink:driver:pinnedGroupId')
      return legacy ? [legacy] : []
    }
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : []
  } catch { return [] }
}

function persist(ids: string[]) {
  try {
    window.localStorage.setItem(FAV_KEY, JSON.stringify(ids))
    // Notification intra-tab : `storage` event ne se déclenche que cross-tab.
    window.dispatchEvent(new CustomEvent(EVT))
  } catch { /* noop */ }
}

export function useGroupFavorites() {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    setIds(load())
    const sync = () => setIds(load())
    window.addEventListener('storage', sync)
    window.addEventListener(EVT, sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(EVT, sync)
    }
  }, [])

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]
      persist(next)
      return next
    })
  }, [])

  const has = useCallback((id: string) => ids.includes(id), [ids])
  const primary = ids[0] ?? null

  return { ids, has, toggle, primary }
}
