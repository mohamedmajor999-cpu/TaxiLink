'use client'
import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { groupService } from '@/services/groupService'

// Cache module-level pour eviter le refetch a chaque montage de SidebarNav
// (DriverDashboard remonte la sidebar a chaque navigation interne). TTL court
// pour que le nom se rafraichisse apres un changement de groupe primaire sans
// avoir besoin d'un reload complet (sinon le cache resterait fige a vie).
const CACHE_TTL_MS = 60_000
let cache: { userId: string; promise: Promise<string | null>; expiresAt: number } | null = null

function load(userId: string): Promise<string | null> {
  const now = Date.now()
  if (cache?.userId === userId && cache.expiresAt > now) return cache.promise
  const promise = groupService
    .getMyGroups(userId)
    .then((groups) => groups[0]?.name ?? null)
    .catch(() => null)
  cache = { userId, promise, expiresAt: now + CACHE_TTL_MS }
  return promise
}

/**
 * Nom du premier groupe du chauffeur, affiche dans la sidebar
 * ("Taxi13 · En ligne"). Renvoie null tant que non charge ou si le
 * chauffeur n'est dans aucun groupe — le composant consommateur doit
 * gerer ce cas (afficher uniquement le statut online).
 */
export function useDriverPrimaryGroupName(): string | null {
  const { user } = useAuth()
  const [name, setName] = useState<string | null>(null)
  useEffect(() => {
    if (!user?.id) {
      setName(null)
      return
    }
    let cancelled = false
    void load(user.id).then((n) => { if (!cancelled) setName(n) })
    return () => { cancelled = true }
  }, [user?.id])
  return name
}
