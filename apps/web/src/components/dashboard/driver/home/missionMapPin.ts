import type { DivIcon } from 'leaflet'

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

export async function createMeMarkerIcon() {
  const L = (await import('leaflet')).default
  return L.icon({
    iconUrl: '/brand/icon.svg',
    iconSize: [36, 51],
    iconAnchor: [18, 48],
    className: 'me-marker-taxi',
  })
}
