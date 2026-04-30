export type GpsApp = 'waze' | 'maps'
export type GpsPreference = GpsApp | 'ask'

export const DEFAULT_GPS_PREFERENCE: GpsPreference = 'ask'

const VALID: readonly GpsPreference[] = ['ask', 'waze', 'maps']

export function isValidGpsPreference(v: unknown): v is GpsPreference {
  return typeof v === 'string' && (VALID as readonly string[]).includes(v)
}

export function buildGpsUrl(app: GpsApp, address: string): string {
  const q = encodeURIComponent(address)
  if (app === 'waze') return `https://waze.com/ul?q=${q}&navigate=yes`
  return `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=driving`
}

export function gpsAppLabel(app: GpsApp): string {
  return app === 'waze' ? 'Waze' : 'Google Maps'
}
