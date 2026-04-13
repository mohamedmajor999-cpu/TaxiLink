import { useState } from 'react'
import { groupService } from '@/services/groupService'
import type { Group } from '@taxilink/core'

interface Params {
  driverId:  string | null
  setGroups: (fn: (prev: Group[]) => Group[]) => void
  loadGroups: () => Promise<void>
  setError:  (msg: string | null) => void
}

export function useGroupActions({ driverId, setGroups, loadGroups, setError }: Params) {
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin,   setShowJoin]   = useState(false)
  const [newName,    setNewName]    = useState('')
  const [newDesc,    setNewDesc]    = useState('')
  const [joinId,     setJoinId]     = useState('')
  const [saving,     setSaving]     = useState(false)

  const handleCreate = async () => {
    if (!driverId || !newName.trim()) return
    setSaving(true)
    try {
      const group = await groupService.create(newName.trim(), newDesc.trim() || null, driverId)
      setGroups((prev) => [group, ...prev])
      setShowCreate(false)
      setNewName('')
      setNewDesc('')
    } catch (err: unknown) {
      setError(`Erreur: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSaving(false)
    }
  }

  const handleJoin = async () => {
    if (!driverId || !joinId.trim()) return
    setSaving(true)
    try {
      await groupService.join(joinId.trim(), driverId)
      await loadGroups()
      setShowJoin(false)
      setJoinId('')
    } catch {
      setError('Groupe introuvable ou déjà membre')
    } finally {
      setSaving(false)
    }
  }

  const handleLeave = async (groupId: string) => {
    if (!driverId) return
    try {
      await groupService.leave(groupId, driverId)
      setGroups((prev) => prev.filter((g) => g.id !== groupId))
    } catch {
      setError('Erreur lors de la sortie du groupe')
    }
  }

  const handleDelete = async (groupId: string) => {
    try {
      await groupService.deleteGroup(groupId)
      setGroups((prev) => prev.filter((g) => g.id !== groupId))
    } catch {
      setError('Erreur lors de la suppression du groupe')
    }
  }

  return {
    showCreate, setShowCreate, showJoin, setShowJoin,
    newName, setNewName, newDesc, setNewDesc,
    joinId, setJoinId, saving,
    handleCreate, handleJoin, handleLeave, handleDelete,
  }
}
