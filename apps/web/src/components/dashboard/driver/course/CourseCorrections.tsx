'use client'
import { useState } from 'react'
import { Pencil } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { EditAddressesModal } from './EditAddressesModal'
import { EditPriceDialog } from './EditPriceDialog'
import type { missionService } from '@/services/missionService'

const ADDRESS_EDITABLE_STATUSES = new Set(['IN_PROGRESS', 'ACCEPTED'])
const PRICE_EDITABLE_STATUSES = new Set(['DONE'])

type CorrectPatch = Parameters<typeof missionService.correct>[1]

interface Props {
  mission: Mission
  driverId: string | null
  saving: boolean
  onCorrect: (patch: CorrectPatch) => Promise<void> | void
}

export function CourseCorrections({ mission, driverId, saving, onCorrect }: Props) {
  const [addrOpen, setAddrOpen] = useState(false)
  const [priceOpen, setPriceOpen] = useState(false)

  const isOwnDriver = !!driverId && mission.driver_id === driverId
  const canEditAddresses = isOwnDriver && ADDRESS_EDITABLE_STATUSES.has(mission.status)
  const canEditPrice = isOwnDriver && PRICE_EDITABLE_STATUSES.has(mission.status)

  if (!canEditAddresses && !canEditPrice) return null

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-3">
        {canEditAddresses && (
          <button
            type="button"
            onClick={() => setAddrOpen(true)}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-warm-700 bg-warm-50 border border-warm-200 hover:bg-warm-100 transition-colors px-3 py-2 rounded-xl"
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
            Corriger les adresses
          </button>
        )}
        {canEditPrice && (
          <button
            type="button"
            onClick={() => setPriceOpen(true)}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-warm-700 bg-warm-50 border border-warm-200 hover:bg-warm-100 transition-colors px-3 py-2 rounded-xl"
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
            {mission.price_eur != null ? 'Modifier le prix réel' : 'Saisir le prix réel'}
          </button>
        )}
      </div>

      {canEditAddresses && (
        <EditAddressesModal
          open={addrOpen}
          initialDeparture={mission.departure}
          initialDestination={mission.destination}
          saving={saving}
          onClose={() => setAddrOpen(false)}
          onSave={async (patch) => {
            await onCorrect(patch)
            setAddrOpen(false)
          }}
        />
      )}
      {canEditPrice && (
        <EditPriceDialog
          open={priceOpen}
          initialPrice={mission.price_eur}
          saving={saving}
          onClose={() => setPriceOpen(false)}
          onSave={async (price) => {
            await onCorrect({ price_eur: price })
            setPriceOpen(false)
          }}
        />
      )}
    </>
  )
}
