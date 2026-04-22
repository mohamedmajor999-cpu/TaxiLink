'use client'
import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { groupService } from '@/services/groupService'

export function useInviteJoinCard(groupId: string) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleJoin = useCallback(async () => {
    if (!user) {
      const target = `/rejoindre/${groupId}`
      router.push(`/auth/login?redirect=${encodeURIComponent(target)}`)
      return
    }
    setJoining(true)
    setError(null)
    try {
      await groupService.join(groupId, user.id)
      setDone(true)
      router.push(`/dashboard/chauffeur/groupe/${groupId}`)
    } catch {
      setError('Impossible de rejoindre ce groupe. Il se peut qu\'il n\'existe plus ou que tu en sois déjà membre.')
    } finally {
      setJoining(false)
    }
  }, [groupId, router, user])

  return {
    isAuthenticated: !!user,
    authLoading,
    joining,
    error,
    done,
    handleJoin,
  }
}
