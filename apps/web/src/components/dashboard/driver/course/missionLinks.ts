// Helpers de construction des deeplinks utilises par MissionDetailScreen :
// SMS pre-rempli au patient + navigation Google Maps. Waze a un lien direct
// inline car trivial.

interface Coords { lat: number; lng: number }

export function buildSmsHref(phone: string, driverName: string): string {
  const clean = phone.replace(/\s/g, '')
  const body = driverName
    ? `Bonjour, je suis ${driverName}, votre chauffeur. J'arrive au point de rendez-vous.`
    : `Bonjour, je suis votre chauffeur. J'arrive au point de rendez-vous.`
  return `sms:${clean}?body=${encodeURIComponent(body)}`
}

export function buildGmapsHref(to: Coords | null, fallbackAddress?: string | null): string | null {
  if (to) return `https://www.google.com/maps/dir/?api=1&destination=${to.lat},${to.lng}&travelmode=driving`
  if (fallbackAddress) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fallbackAddress)}&travelmode=driving`
  return null
}
