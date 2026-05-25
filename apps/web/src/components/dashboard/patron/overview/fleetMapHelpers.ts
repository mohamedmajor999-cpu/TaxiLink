import L from 'leaflet'
import type { PatronFleetMember } from '@/services/patronFleetService'

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const ESRI_SAT_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const PIN_PULSE_KEYFRAMES = '@keyframes patron-pin-pulse{0%{transform:scale(0.85);opacity:0.6}80%{transform:scale(2);opacity:0}100%{transform:scale(2);opacity:0}}'

export type TileMode = 'street' | 'satellite'
export type PositionedDriver = PatronFleetMember & { lat: number; lng: number }

export function injectPinKeyframesOnce() {
  if (typeof document === 'undefined') return
  if (document.getElementById('patron-pin-keyframes')) return
  const style = document.createElement('style')
  style.id = 'patron-pin-keyframes'
  style.textContent = PIN_PULSE_KEYFRAMES
  document.head.appendChild(style)
}

// Calcule un libelle court pour le chrono pin : "Xs" jusqu'a 60s, puis "Xm".
function chronoLabel(ageSec: number): string {
  if (ageSec < 60) return `${ageSec}s`
  const min = Math.min(99, Math.floor(ageSec / 60))
  return `${min}m`
}

// Choisit la couleur du badge chrono selon la fraicheur du dernier fix GPS.
// Vert <15s = en ligne actif ; rouge >60s = service GPS probablement coupe.
function chronoColor(ageSec: number): string {
  if (ageSec < 15) return '#10B981'
  if (ageSec < 30) return '#FACC15'
  if (ageSec < 60) return '#F97316'
  return '#EF4444'
}

export function makePinIcon(
  status: PatronFleetMember['status'],
  initials: string,
  updatedAt: string | null = null,
  nowMs: number = Date.now(),
): L.DivIcon {
  const color = status === 'in-mission' ? '#FFD11A' : status === 'online' ? '#22C55E' : '#9CA3AF'
  const fg = status === 'in-mission' ? '#0A0A0A' : '#FFFFFF'
  const showPulse = status === 'in-mission' || status === 'online'
  const pulseHtml = showPulse
    ? `<span style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.45;animation:patron-pin-pulse 1.8s ease-out infinite;pointer-events:none"></span>`
    : ''
  // Chrono badge (sous le pin) : age du dernier signal GPS. Affiche uniquement
  // si on a un updatedAt (le chauffeur a deja envoye une position). Demande
  // user 2026-05-25 : "savoir dans combien de temps un nouveau signal".
  let chronoHtml = ''
  if (updatedAt) {
    const ageSec = Math.max(0, Math.floor((nowMs - new Date(updatedAt).getTime()) / 1000))
    const cBg = chronoColor(ageSec)
    chronoHtml = `<div style="position:absolute;left:50%;top:38px;transform:translateX(-50%);padding:1px 5px;border-radius:8px;background:${cBg};color:#fff;font-size:9px;font-weight:800;font-family:Inter,system-ui,sans-serif;letter-spacing:-0.2px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.3)">${chronoLabel(ageSec)}</div>`
  }
  return L.divIcon({
    className: 'patron-fleet-pin',
    html: `<div style="position:relative;width:36px;height:36px">${pulseHtml}<div style="position:relative;width:36px;height:36px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:${fg};font-weight:800;font-size:11px;font-family:Inter,system-ui,sans-serif;letter-spacing:0.02em">${initials}</div>${chronoHtml}</div>`,
    iconSize: [36, 56],
    iconAnchor: [18, 18],
  })
}

export function buildTileLayer(mode: TileMode): L.TileLayer {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (mode === 'satellite') {
    if (token) return L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}@2x?access_token=${token}`, { maxZoom: 19, tileSize: 512, zoomOffset: -1 })
    return L.tileLayer(ESRI_SAT_URL, { maxZoom: 19 })
  }
  if (token) return L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}@2x?access_token=${token}`, { maxZoom: 19, tileSize: 512, zoomOffset: -1 })
  return L.tileLayer(OSM_URL, { maxZoom: 19 })
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c))
}

// Espace en cercle les chauffeurs aux memes coords (~30 m).
// Groupe a 4 decimales = ~11 m de precision.
export function spiderfyCoincident(drivers: PositionedDriver[]): Map<string, [number, number]> {
  const groups = new Map<string, PositionedDriver[]>()
  for (const d of drivers) {
    const key = `${d.lat.toFixed(4)},${d.lng.toFixed(4)}`
    const arr = groups.get(key) ?? []
    arr.push(d)
    groups.set(key, arr)
  }
  const offsets = new Map<string, [number, number]>()
  const RADIUS_DEG = 0.00027 // ~30 m
  Array.from(groups.values()).forEach((drs) => {
    if (drs.length === 1) {
      offsets.set(drs[0].id, [drs[0].lat, drs[0].lng])
      return
    }
    const baseLat = drs[0].lat
    const baseLng = drs[0].lng
    const lngScale = 1 / Math.max(0.01, Math.cos((baseLat * Math.PI) / 180))
    drs.forEach((d, i) => {
      const angle = (2 * Math.PI * i) / drs.length
      offsets.set(d.id, [
        baseLat + RADIUS_DEG * Math.sin(angle),
        baseLng + RADIUS_DEG * Math.cos(angle) * lngScale,
      ])
    })
  })
  return offsets
}
