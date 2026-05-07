import { useState } from 'react'
import { driverBlockService } from '@/services/driverBlockService'

interface Args {
  blockerId:        string
  targetId:         string
  initialBlocked:   boolean
  onClose:          () => void
  onChanged?:       (nowBlocked: boolean) => void
}

/**
 * Logique du BlockDriverModal : applique block ou unblock selon initialBlocked.
 * Un seul composant pour les deux flux — le bouton et le texte changent.
 */
export function useBlockDriverModal({ blockerId, targetId, initialBlocked, onClose, onChanged }: Args) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      if (initialBlocked) await driverBlockService.unblock(blockerId, targetId)
      else                await driverBlockService.block(blockerId, targetId)
      onChanged?.(!initialBlocked)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, submit }
}
