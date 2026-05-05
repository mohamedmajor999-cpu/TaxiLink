import type { DivIcon } from 'leaflet'
import type { Mission } from '@/lib/supabase/types'
import { computeDisplayFare } from '@/lib/missionFare'

interface PinOptions {
  priceLabel: string
  selected: boolean
  urgent: boolean
  medical: boolean
}

// Croix médicale épurée — SVG inline pour rester net à toutes tailles
// (preferé à un pseudo-element pour rendu sub-pixel sur mobile).
const MEDICAL_CROSS_SVG =
  '<svg class="mp-rx-svg" viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">' +
  '<path d="M5 1.5h2v3h3v2H7v3H5v-3H2v-2h3v-3z" fill="currentColor"/>' +
  '</svg>'

export async function createMissionPinIcon(opts: PinOptions): Promise<DivIcon> {
  const L = (await import('leaflet')).default
  const classes = ['mission-pin']
  if (opts.selected) classes.push('selected')
  if (opts.urgent) classes.push('urgent')
  if (opts.medical) classes.push('medical')
  const badge = opts.medical ? `<span class="mp-rx">${MEDICAL_CROSS_SVG}</span>` : ''
  return L.divIcon({
    html: `<div class="${classes.join(' ')}">${badge}<span class="mp-price">${opts.priceLabel}</span></div>`,
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
