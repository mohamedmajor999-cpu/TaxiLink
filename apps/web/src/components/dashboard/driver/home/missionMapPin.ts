import type { DivIcon } from 'leaflet'
import type { Mission } from '@/lib/supabase/types'
import { computeDisplayFare } from '@/lib/missionFare'

interface PinOptions {
  priceLabel: string
  selected: boolean
  urgent: boolean
  medical: boolean
}

// Pictogrammes des badges — SVG inline (rendu net à toutes les tailles).
// CPAM : Étoile de la Vie (symbole international du transport médical d'urgence).
// Privé : silhouette passager.
const MEDICAL_CROSS_SVG =
  '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">' +
  '<g fill="currentColor">' +
  '<rect x="10.5" y="2" width="3" height="20" rx="1.2"/>' +
  '<rect x="10.5" y="2" width="3" height="20" rx="1.2" transform="rotate(60 12 12)"/>' +
  '<rect x="10.5" y="2" width="3" height="20" rx="1.2" transform="rotate(120 12 12)"/>' +
  '</g>' +
  '</svg>'
const PRIVATE_PERSON_SVG =
  '<svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">' +
  '<circle cx="6" cy="3.4" r="1.8" fill="currentColor"/>' +
  '<path d="M2.2 10.2c0-2.1 1.7-3.8 3.8-3.8s3.8 1.7 3.8 3.8v0.3H2.2v-0.3z" fill="currentColor"/>' +
  '</svg>'

export async function createMissionPinIcon(opts: PinOptions): Promise<DivIcon> {
  const L = (await import('leaflet')).default
  const variant = opts.medical ? 'medical' : 'private'
  const classes = ['mission-pin', variant]
  if (opts.selected) classes.push('selected')
  if (opts.urgent) classes.push('urgent')
  const icon = opts.medical ? MEDICAL_CROSS_SVG : PRIVATE_PERSON_SVG
  const badge = `<span class="mp-rx">${icon}</span>`
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
