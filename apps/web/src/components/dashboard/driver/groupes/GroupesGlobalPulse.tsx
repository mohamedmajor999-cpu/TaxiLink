'use client'
import { Zap } from 'lucide-react'

interface Props {
  availableTotal: number
  onlineTotal:    number
}

// Bandeau noir agrégé sur tous les groupes du chauffeur — donne un signal de
// vie immédiat ("est-ce que ça bouge ?") sans avoir à ouvrir chaque groupe.
// Caché si tout est à zéro pour ne pas occuper l'écran avec du vide.
export function GroupesGlobalPulse({ availableTotal, onlineTotal }: Props) {
  if (availableTotal === 0 && onlineTotal === 0) return null
  return (
    <div className="mb-3 rounded-2xl bg-ink text-paper p-3.5 flex items-center gap-3">
      <span className="w-9 h-9 rounded-xl bg-brand/15 text-brand flex items-center justify-center shrink-0">
        <Zap className="w-4 h-4" strokeWidth={2.2} />
      </span>
      <div className="flex-1 min-w-0 leading-tight">
        <p className="text-[13.5px] font-semibold">
          {availableTotal > 0 && (
            <><span className="text-brand font-bold">{availableTotal} course{availableTotal > 1 ? 's' : ''}</span> à prendre</>
          )}
          {availableTotal > 0 && onlineTotal > 0 && ' · '}
          {onlineTotal > 0 && (
            <><span className="text-brand font-bold">{onlineTotal} collègue{onlineTotal > 1 ? 's' : ''}</span> en ligne</>
          )}
        </p>
        <p className="text-[11px] text-paper/55 mt-0.5">Sur tous tes groupes maintenant</p>
      </div>
    </div>
  )
}
