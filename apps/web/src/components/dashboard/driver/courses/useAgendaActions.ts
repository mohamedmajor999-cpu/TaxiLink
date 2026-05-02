'use client'
import { useMemo, useState } from 'react'
import { missionService } from '@/services/missionService'
import type { Mission } from '@/lib/supabase/types'

/**
 * Pilote les actions par carte (kebab) : menu, édition, suppression.
 * Découplé de useAgendaTab pour respecter le seuil de taille.
 */
export function useAgendaActions(
  missions: Mission[],
  removeFromList: (id: string) => void,
  onError: (msg: string) => void,
) {
  const [menuMissionId, setMenuMissionId] = useState<string | null>(null)
  const [editMissionId, setEditMissionId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const menuMission = useMemo(
    () => missions.find((m) => m.id === menuMissionId) ?? null,
    [missions, menuMissionId],
  )
  const editMission = useMemo(
    () => missions.find((m) => m.id === editMissionId) ?? null,
    [missions, editMissionId],
  )

  function openMenuFor(id: string) { setMenuMissionId(id) }
  function closeMenu() { setMenuMissionId(null) }

  function openEditFor(id: string) {
    setMenuMissionId(null)
    setEditMissionId(id)
  }
  function closeEdit() { setEditMissionId(null) }

  async function deleteMission(id: string) {
    setRemovingId(id)
    try {
      await missionService.removeManual(id)
      removeFromList(id)
      setMenuMissionId(null)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Erreur lors de la suppression')
    } finally {
      setRemovingId(null)
    }
  }

  return {
    menuMission, openMenuFor, closeMenu,
    editMission, openEditFor, closeEdit,
    deleteMission, removingId,
  }
}
