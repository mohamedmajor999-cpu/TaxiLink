// Biais géographique : détecte une grande ville française dans une requête
// pour centrer la recherche Google Places autour (rayon 50km). Par défaut
// (aucune ville explicite), priorise la métropole Aix-Marseille-Provence.

const MARSEILLE: { lat: number; lng: number } = { lat: 43.2965, lng: 5.3698 }

const FR_CITY_PROXIMITY: Record<string, { lat: number; lng: number }> = {
  marseille: MARSEILLE,
  paris: { lat: 48.8566, lng: 2.3522 },
  lyon: { lat: 45.764, lng: 4.8357 },
  toulouse: { lat: 43.6047, lng: 1.4442 },
  nice: { lat: 43.7102, lng: 7.262 },
  nantes: { lat: 47.2184, lng: -1.5536 },
  bordeaux: { lat: 44.8378, lng: -0.5792 },
  lille: { lat: 50.6292, lng: 3.0573 },
  strasbourg: { lat: 48.5734, lng: 7.7521 },
  rennes: { lat: 48.1173, lng: -1.6778 },
  montpellier: { lat: 43.6108, lng: 3.8767 },
  aix: { lat: 43.5297, lng: 5.4474 },
  avignon: { lat: 43.9493, lng: 4.8055 },
  toulon: { lat: 43.1242, lng: 5.928 },
}

const DIACRITICS_RE = /[̀-ͯ]/g

export function detectCityProximity(q: string): { lat: number; lng: number } {
  const norm = q.toLowerCase().normalize('NFD').replace(DIACRITICS_RE, '')
  for (const [key, coords] of Object.entries(FR_CITY_PROXIMITY)) {
    if (new RegExp(`\\b${key}\\b`).test(norm)) return coords
  }
  return MARSEILLE
}
