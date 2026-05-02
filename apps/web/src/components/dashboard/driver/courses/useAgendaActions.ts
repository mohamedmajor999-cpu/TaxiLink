'use client'
import { useMemo, useState } from 'react'
import { missionService } from '@/services/missionService'
import { useMissionEditSheetStore } from '@/store/missionEditSheetStore'
import type { Mission } from '@/lib/supabase/types'

function isManualMission(m: Mission | null): boolean {
  if (!m) return false
  return m.shared_by === null && m.client_id === null && m.status === 'ACCEPTED'
}

/**
 * Pilote les actions par carte (kebab) selon le type de course.
 *  - Manual : édition complète via AgendaAddModal, suppression réelle (DELETE)
 *  - Réseau : correction limitée via MissionEditSheet, annulation (libère au pool)
 *
 * Découplé de useAgendaTab pour rester sous le seuil de 200 lignes.
 */
export function useAgendaActions(
  missions: Mission[],
  removeFromList: (id: string) => void,
  onError: (msg: string) => void,
) {
  const [menuMissionId, setMenuMissionId] = useState<string | null>(null)
  const [editMissionId, setEditMissionId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [cancelOpenId, setCancelOpenId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const findMission = (id: string | null) => missions.find((m) => m.id === id) ?? null

  const menuMission = useMemo(() => findMission(menuMissionId), [missions, menuMissionId])
  const editMission = useMemo(() => findMission(editMissionId), [missions, editMissionId])
  const deletingMission = useMemo(() => findMission(confirmDeleteId), [missions, confirmDeleteId])

  function openMenuFor(id: string) { setMenuMissionId(id) }
  function closeMenu() { setMenuMissionId(null) }

  /**
   * Modifier : full edit pour manual, correction limitée (sheet) pour réseau.
   * Le sheet existant est monté au niveau de DriverDashboard.
   */
  function openEditFor(id: string) {
    const m = findMission(id)
    if (!m) return
    setMenuMissionId(null)
    if (isManualMission(m)) {
      setEditMissionId(id)
    } else {
      useMissionEditSheetStore.getState().open(m, 'corrections')
    }
  }
  function closeEdit() { setEditMissionId(null) }

  /** Action rouge : confirm DELETE pour manual, dialog d'annulation pour réseau. */
  function requestDelete(id: string) {
    const m = findMission(id)
    if (!m) return
    setMenuMissionId(null)
    if (isManualMission(m)) setConfirmDeleteId(id)
    else setCancelOpenId(id)
  }
  function closeDeleteConfirm() { setConfirmDeleteId(null) }
  function closeCancel() { setCancelOpenId(null) }

  async function deleteMission(id: string) {
    setBusyId(id)
    try {
      await missionService.removeManual(id)
      removeFromList(id)
      setConfirmDeleteId(null)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Erreur lors de la suppression')
    } finally {
      setBusyId(null)
    }
  }

  async function cancelMission(id: string, reason: string) {
    setBusyId(id)
    try {
      await missionService.cancel(id, reason)
      removeFromList(id)
      setCancelOpenId(null)
    } catch (e) {
      onError(e instanceof Error ? e.message : "Erreur lors de l'annulation")
    } finally {
      setBusyId(null)
    }
  }

  return {
    menuMission, openMenuFor, closeMenu, isManualMenu: isManualMission(menuMission),
    editMission, openEditFor, closeEdit,
    deletingMission, requestDelete, closeDeleteConfirm, deleteMission,
    cancelOpenId, closeCancel, cancelMission,
    busyId,
  }
}
