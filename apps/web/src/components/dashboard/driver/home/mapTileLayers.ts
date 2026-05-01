// Renvoie l'URL et les options pour la couche de tuiles a appliquer selon
// la vue (street/satellite) et le mode jour/nuit. Mapbox pour street, Esri
// World Imagery (gratuit, pas de cle) pour satellite — beaucoup plus rapide
// que Mapbox satellite-streets qui empile une couche raster + une couche
// vectorielle de noms de rues.

import type { TileLayerOptions } from 'leaflet'

export type MapView = 'street' | 'satellite'

const MAPBOX_STYLE_DAY = 'streets-v12'
const MAPBOX_STYLE_NIGHT = 'navigation-night-v1'
const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

// Esri World Imagery : raster pur, hautes resolutions, hosted sur CDN
// rapide. Subdomains pour parallelisation des requetes.
const ESRI_SAT_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

const ESRI_SAT_OPTS: TileLayerOptions = {
  maxZoom: 19,
  // attribution affichee uniquement si Leaflet l'active dans le control —
  // ici attributionControl est false sur la map principale, donc invisible
  // mais on respecte la licence Esri en l'attachant a la couche.
  attribution: 'Tiles &copy; Esri',
}

export function tileUrlFor(
  view: MapView,
  night: boolean | undefined,
): { url: string; opts: TileLayerOptions } {
  if (view === 'satellite') {
    // Toujours Esri pour satellite (rapide, gratuit, pas de cle).
    return { url: ESRI_SAT_URL, opts: ESRI_SAT_OPTS }
  }
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (token) return mapboxLayer(night ? MAPBOX_STYLE_NIGHT : MAPBOX_STYLE_DAY, token)
  return { url: OSM_URL, opts: { maxZoom: 19 } }
}

function mapboxLayer(style: string, token: string) {
  return {
    url: `https://api.mapbox.com/styles/v1/mapbox/${style}/tiles/{z}/{x}/{y}@2x?access_token=${token}`,
    opts: { maxZoom: 19, tileSize: 512, zoomOffset: -1 } as TileLayerOptions,
  }
}
