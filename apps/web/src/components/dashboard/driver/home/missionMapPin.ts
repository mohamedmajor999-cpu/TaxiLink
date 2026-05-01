import type { DivIcon } from 'leaflet'
import type { Mission } from '@/lib/supabase/types'
import { computeDisplayFare } from '@/lib/missionFare'

interface PinOptions {
  priceLabel: string
  selected: boolean
  urgent: boolean
  // Quand > 1, le pin represente N annonces empilees (meme adresse) :
  // affiche le prix passe + badge "+N-1" et applique le visuel stacked.
  count?: number
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
  const stacked = opts.count != null && opts.count > 1
  if (stacked) classes.push('stacked')
  const stackCard = stacked ? '<span class="mp-stack-card"></span>' : ''
  const countBadge = stacked
    ? `<span class="mp-count">+${opts.count! - 1}</span>`
    : ''
  return L.divIcon({
    html: `<div class="${classes.join(' ')}">${stackCard}${escapeHtml(opts.priceLabel)}${countBadge}</div>`,
    className: '',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

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
  return `${value.toFixed(2).replace('.', ',')} €`
}
