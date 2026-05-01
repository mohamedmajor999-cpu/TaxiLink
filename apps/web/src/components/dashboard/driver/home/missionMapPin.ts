import type { DivIcon } from 'leaflet'
import type { Mission } from '@/lib/supabase/types'
import { computeDisplayFare } from '@/lib/missionFare'

interface PinOptions {
  priceLabel: string
  selected: boolean
  urgent: boolean
}

export async function createMissionPinIcon(opts: PinOptions): Promise<DivIcon> {
  const L = (await import('leaflet')).default
  const classes = ['mission-pin']
  if (opts.selected) classes.push('selected')
  if (opts.urgent) classes.push('urgent')
  return L.divIcon({
    html: `<div class="${classes.join(' ')}">${opts.priceLabel}</div>`,
    className: '',
    iconSize: [0, 0],
    iconAnchor: [0, -6],
  })
}

// Marqueur chauffeur : carre arrondi jaune avec icone taxi noire.
// Remplace l'ancien PNG /brand/icon.svg.
export async function createDriverIcon(): Promise<DivIcon> {
  const L = (await import('leaflet')).default
  return L.divIcon({
    html: '<div class="me-driver-icon"><span class="material-symbols-outlined">local_taxi</span></div>',
    className: '',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

export function formatMissionPriceLabel(m: Mission): string {
  const value = computeDisplayFare(m).value
  const rounded = Number.isInteger(value)
    ? value.toFixed(0)
    : value.toFixed(2).replace(/0$/, '').replace(/\.$/, '')
  return `${rounded.replace('.', ',')} €`
}
