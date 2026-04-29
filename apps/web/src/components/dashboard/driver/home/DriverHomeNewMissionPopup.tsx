'use client'
import type { Mission } from '@/lib/supabase/types'
import { NewMissionPopup } from './NewMissionPopup'
import type { LatLng } from '@/lib/geoDistance'

interface Props {
  popup: { current: Mission | null; dismiss: (id: string) => void }
  userCoords: LatLng | null
  onAccept: (id: string) => Promise<void>
  onShowDetail: (id: string) => void
}

/**
 * Wrapper qui consomme la file de popups et binde les handlers : dismiss
 * + accept + detail. Garde DriverHome.tsx en-dessous du seuil de lignes.
 */
export function DriverHomeNewMissionPopup({ popup, userCoords, onAccept, onShowDetail }: Props) {
  const m = popup.current
  if (!m) return null
  const handleAccept = async () => {
    popup.dismiss(m.id)
    try { await onAccept(m.id) } catch { /* toast deja gere */ }
  }
  const handleDetail = () => {
    popup.dismiss(m.id)
    onShowDetail(m.id)
  }
  return (
    <NewMissionPopup
      mission={m}
      userCoords={userCoords}
      onAccept={handleAccept}
      onDetail={handleDetail}
      onDismiss={() => popup.dismiss(m.id)}
    />
  )
}
