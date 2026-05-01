'use client'
import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { AddressField } from '../AddressField'
import type { AddressSuggestion } from '@/services/addressService'

interface AddressPatch {
  departure?: string
  destination?: string
  departure_lat?: number | null
  departure_lng?: number | null
  destination_lat?: number | null
  destination_lng?: number | null
}

interface Props {
  open: boolean
  initialDeparture: string
  initialDestination: string
  saving: boolean
  onClose: () => void
  onSave: (patch: AddressPatch) => void | Promise<void>
}

export function EditAddressesModal({
  open, initialDeparture, initialDestination, saving, onClose, onSave,
}: Props) {
  const [departure, setDeparture] = useState(initialDeparture)
  const [destination, setDestination] = useState(initialDestination)
  const [depCoords, setDepCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [dstCoords, setDstCoords] = useState<{ lat: number; lng: number } | null>(null)

  if (!open) return null

  const onSelectDeparture = (s: AddressSuggestion) => {
    setDeparture(s.label)
    if (s.lat != null && s.lng != null) setDepCoords({ lat: s.lat, lng: s.lng })
  }
  const onSelectDestination = (s: AddressSuggestion) => {
    setDestination(s.label)
    if (s.lat != null && s.lng != null) setDstCoords({ lat: s.lat, lng: s.lng })
  }

  const changedDeparture = departure.trim() !== initialDeparture.trim()
  const changedDestination = destination.trim() !== initialDestination.trim()
  const hasChanges = changedDeparture || changedDestination

  const submit = async () => {
    if (!hasChanges || saving) return
    const patch: AddressPatch = {}
    if (changedDeparture) {
      patch.departure = departure.trim()
      if (depCoords) {
        patch.departure_lat = depCoords.lat
        patch.departure_lng = depCoords.lng
      }
    }
    if (changedDestination) {
      patch.destination = destination.trim()
      if (dstCoords) {
        patch.destination_lat = dstCoords.lat
        patch.destination_lng = dstCoords.lng
      }
    }
    await onSave(patch)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-paper w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-soft max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-warm-200">
          <h2 className="text-[16px] font-extrabold text-ink tracking-tight">
            Corriger les adresses
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-8 h-8 rounded-xl bg-warm-100 flex items-center justify-center text-ink hover:bg-warm-200"
          >
            <X className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="text-[12.5px] text-warm-600 mb-4 leading-snug">
            Ajustez l’adresse pour préciser un numéro de bâtiment, un code d’accès ou corriger une faute.
          </p>
          <AddressField
            label="Départ"
            placeholder="Adresse de départ"
            value={departure}
            onChange={setDeparture}
            onSelectSuggestion={onSelectDeparture}
            filled={departure.trim().length >= 5}
          />
          <AddressField
            label="Arrivée"
            placeholder="Adresse d'arrivée"
            value={destination}
            onChange={setDestination}
            onSelectSuggestion={onSelectDestination}
            filled={destination.trim().length >= 5}
          />
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-2xl border border-warm-200 bg-paper text-ink text-[14px] font-semibold hover:bg-warm-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!hasChanges || saving}
              className="flex-[2] h-12 rounded-2xl bg-ink text-paper text-[14px] font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
