'use client'

import { useEffect, useState } from 'react'
import { groupService } from '@/services/groupService'
import type { Group } from '@taxilink/core'

/**
 * Charge les groupes du chauffeur courant et les rafraîchit quand l'onglet
 * redevient visible / la fenêtre reprend le focus. Sinon une longue session
 * idle (RLS/auth refresh, réseau) peut laisser une liste périmée et l'user
 * doit changer de page pour la voir mise à jour.
 *
 * @param onEmpty appelé quand la liste retourne 0 — typiquement pour basculer
 *   le formulaire en visibilité PUBLIC (le sas Preflight n'a rien à proposer).
 */
export function usePosterGroupsLoader(driverId: string | undefined, onEmpty: () => void) {
  const [myGroups, setMyGroups] = useState<Group[]>([])

  useEffect(() => {
    if (!driverId) return
    let cancelled = false
    const fetchGroups = () => {
      groupService.getMyGroups(driverId)
        .then((groups) => {
          if (cancelled) return
          setMyGroups(groups)
          if (groups.length === 0) onEmpty()
        })
        .catch(() => { /* silencieux */ })
    }
    fetchGroups()
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchGroups()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', fetchGroups)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', fetchGroups)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId])

  return myGroups
}
