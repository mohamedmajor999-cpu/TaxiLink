// Helpers géographiques partagés. Centralisés ici car la formule de Haversine
// était dupliquée à l'identique dans 3+ composants/hooks, avec des signatures
// divergentes (args objet vs scalaires) et une variante "mètres" (audit M-06).

export interface LatLng {
  lat: number;
  lng: number;
}

const R_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Distance grand-cercle en kilomètres entre deux points (formule de Haversine). */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_KM * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/** Idem en mètres. */
export function haversineMeters(a: LatLng, b: LatLng): number {
  return haversineKm(a, b) * 1000;
}
