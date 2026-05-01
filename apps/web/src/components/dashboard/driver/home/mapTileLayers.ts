// Renvoie l'URL et les options pour la couche de tuiles a appliquer selon
// la vue (street/satellite) et le mode jour/nuit. Mapbox si token, sinon
// fallback OSM (street) ou Esri World Imagery (satellite).

import type { TileLayerOptions } from 'leaflet'

export type MapView = 'street' | 'satellite'

const MAPBOX_STYLE_DAY = 'streets-v12'
const MAPBOX_STYLE_NIGHT = 'navigation-night-v1'
const MAPBOX_STYLE_SATELLITE = 'satellite-streets-v12'
const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const ESRI_SAT_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

export function tileUrlFor(
  view: MapView,
  night: boolean | undefined,
): { url: string; opts: TileLayerOptions } {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (view === 'satellite') {
    if (token) return mapboxLayer(MAPBOX_STYLE_SATELLITE, token)
    return { url: ESRI_SAT_URL, opts: { maxZoom: 19 } }
  }
  if (token) return mapboxLayer(night ? MAPBOX_STYLE_NIGHT : MAPBOX_STYLE_DAY, token)
  return { url: OSM_URL, opts: { maxZoom: 19 } }
}

function mapboxLayer(style: string, token: string) {
  return {
    url: `https://api.mapbox.com/styles/v1/mapbox/${style}/tiles/{z}/{x}/{y}@2x?access_token=${token}`,
    opts: { maxZoom: 19, tileSize: 512, zoomOffset: -1 } as TileLayerOptions,
  }
}
