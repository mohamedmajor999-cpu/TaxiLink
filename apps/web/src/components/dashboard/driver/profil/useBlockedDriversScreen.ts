import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { driverBlockService, type BlockedDriver } from '@/services/driverBlockService'

export function useBlockedDriversScreen() {
  const { user } = useAuth()
  const [list, setList]       = useState<BlockedDriver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true); setError(null)
    try {
      setList(await driverBlockService.getBlockedList(user.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger la liste.')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { load() }, [load])

  const unblock = async (blockedId: string) => {
    if (!user?.id) return
    try {
      await driverBlockService.unblock(user.id, blockedId)
      setList((prev) => prev.filter((b) => b.blockedId !== blockedId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de débloquer.')
    }
  }

  return { list, loading, error, unblock, refresh: load }
}
