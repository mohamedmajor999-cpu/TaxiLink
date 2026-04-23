import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { groupService } from '@/services/groupService'
import type { Group } from '@taxilink/core'

interface Params {
  driverId:  string | null
  setGroups: (fn: (prev: Group[]) => Group[]) => void
  loadGroups: () => Promise<void>
  setError:  (msg: string | null) => void
}

export function useGroupActions({ driverId, setGroups, loadGroups, setError }: Params) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const modalParam = searchParams.get('modal')
  const showCreate = modalParam === 'creer-groupe'
  const showJoin = modalParam === 'rejoindre-groupe'

  const setShowCreate = (open: boolean) => {
    if (open) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('modal', 'creer-groupe')
      router.push(`${pathname}?${params.toString()}`)
    } else {
      router.back()
    }
  }
  const setShowJoin = (open: boolean) => {
    if (open) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('modal', 'rejoindre-groupe')
      router.push(`${pathname}?${params.toString()}`)
    } else {
      router.back()
    }
  }

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
