'use client'
import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { groupService } from '@/services/groupService'

// Cache module-level pour eviter le refetch a chaque montage de SidebarNav
// (DriverDashboard remonte la sidebar a chaque navigation interne).
let cache: { userId: string; promise: Promise<string | null> } | null = null

function load(userId: string): Promise<string | null> {
  if (cache?.userId === userId) return cache.promise
  const promise = groupService
    .getMyGroups(userId)
    .then((groups) => groups[0]?.name ?? null)
    .catch(() => null)
  cache = { userId, promise }
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
