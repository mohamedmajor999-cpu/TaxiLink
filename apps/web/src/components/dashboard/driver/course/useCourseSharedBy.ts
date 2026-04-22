'use client'
import { useEffect, useState } from 'react'
import { profileService } from '@/services/profileService'
import { groupService } from '@/services/groupService'

interface Args {
  sharedBy: string | null | undefined
  currentUserId: string | null | undefined
  missionId: string
  visibility: string
}

interface Result {
  sharerName: string | null
  isSelf: boolean
  groupNames: string[]
}

export function useCourseSharedBy({ sharedBy, currentUserId, missionId, visibility }: Args): Result {
  const [sharerName, setSharerName] = useState<string | null>(null)
  const [groupNames, setGroupNames] = useState<string[]>([])
  const isSelf = !!sharedBy && !!currentUserId && sharedBy === currentUserId

  useEffect(() => {
    if (!sharedBy || isSelf) { setSharerName(null); return }
    let cancelled = false
    profileService.getFullName(sharedBy)
      .then((name) => { if (!cancelled) setSharerName(name) })
      .catch(() => { if (!cancelled) setSharerName(null) })
    return () => { cancelled = true }
  }, [sharedBy, isSelf])

  useEffect(() => {
    if (visibility !== 'GROUP') { setGroupNames([]); return }
    let cancelled = false
    groupService.getNamesForMission(missionId)
      .then((names) => { if (!cancelled) setGroupNames(names) })
      .catch(() => { if (!cancelled) setGroupNames([]) })
    return () => { cancelled = true }
  }, [missionId, visibility])

  return { sharerName, isSelf, groupNames }
}
