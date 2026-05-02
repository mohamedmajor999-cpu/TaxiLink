import { useCallback, useEffect, useState } from 'react'
import { userPrefsService } from '@/services/userPrefsService'

const FAV_KEY = 'taxilink:driver:favoriteGroupIds'
const EVT     = 'taxilink:favs-changed'

// Stockage : tableau ordonné (le 1er entré est le « hero » de la liste).
// localStorage = cache pour l'affichage instantané au mount ; serveur
// (user_metadata.favorite_group_ids) = source de verite pour survivre aux
// evictions (iOS PWA, nettoyage navigateur).
function loadCache(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(FAV_KEY)
    if (!raw) {
      const legacy = window.localStorage.getItem('taxilink:driver:pinnedGroupId')
      return legacy ? [legacy] : []
    }
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : []
  } catch { return [] }
}

function persistCache(ids: string[]) {
  try {
    window.localStorage.setItem(FAV_KEY, JSON.stringify(ids))
    // Notification intra-tab : `storage` event ne se declenche que cross-tab.
    window.dispatchEvent(new CustomEvent(EVT))
  } catch { /* noop */ }
}

export function useGroupFavorites() {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    // 1) cache local immediat (evite le flash "non favori")
    setIds(loadCache())
    // 2) refresh autoritatif depuis le serveur
    userPrefsService.getFavoriteGroupIds()
      .then((server) => {
        setIds(server)
        persistCache(server)
      })
      .catch(() => { /* silencieux : on garde le cache */ })
    const sync = () => setIds(loadCache())
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
      persistCache(next)
      // Persistance serveur en arriere-plan ; un echec laisse le cache local
      // intact, l'UI reste coherente jusqu'au prochain refresh autoritatif.
      userPrefsService.updateFavoriteGroupIds(next).catch(() => { /* silencieux */ })
      return next
    })
  }, [])

  const has = useCallback((id: string) => ids.includes(id), [ids])
  const primary = ids[0] ?? null

  return { ids, has, toggle, primary }
}
