import type { DivIcon } from 'leaflet'
import type { Mission } from '@/lib/supabase/types'
import { computeDisplayFare } from '@/lib/missionFare'

interface PinOptions {
  priceLabel: string
  selected: boolean
  urgent: boolean
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
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

// Pilule chauffeur (Mehdi - AB-123-CD) : icone taxi sur carre arrondi jaune
// + prenom + plaque monospace. Remplace l'ancien PNG /brand/icon.svg.
export async function createDriverPillIcon(args: { firstName: string; plate?: string | null }): Promise<DivIcon> {
  const L = (await import('leaflet')).default
  const name = escapeHtml((args.firstName || 'Vous').trim() || 'Vous')
  const plate = args.plate?.trim() ? escapeHtml(args.plate.trim()) : ''
  const plateHtml = plate ? `<div class="me-driver-plate">${plate}</div>` : ''
  return L.divIcon({
    html:
      '<div class="me-driver-pill">' +
      '<div class="me-driver-icon"><span class="material-symbols-outlined">local_taxi</span></div>' +
      `<div class="me-driver-info"><div class="me-driver-name">${name}</div>${plateHtml}</div>` +
      '</div>',
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
