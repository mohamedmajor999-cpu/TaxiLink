// Renvoie la liste des couches a empiler pour la vue demandee. Pour street :
// 1 seule couche (Mapbox ou OSM). Pour satellite : 2 couches — Esri World
// Imagery en base + CartoDB Voyager labels par-dessus pour villes + routes
// en blanc subtil (style Apple/Google Maps), sans frontieres administratives
// roses. Tuiles raster, CDN rapide, sans cle.

import type { TileLayerOptions } from 'leaflet'

export type MapView = 'street' | 'satellite'

export interface TileLayerSpec {
  url: string
  opts: TileLayerOptions
}

const MAPBOX_STYLE_DAY = 'streets-v12'
const MAPBOX_STYLE_NIGHT = 'navigation-night-v1'
const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

const ESRI_SAT_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
// CartoDB Voyager labels-only = overlay transparent uniquement labels
// (villes + routes nommees), blanc avec halo sombre. Lisible sur satellite,
// look moderne facon Apple Maps. Pas de frontieres roses.
const CARTO_LABELS_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png'

const ESRI_SAT_OPTS: TileLayerOptions = {
  maxZoom: 19,
  attribution: 'Tiles &copy; Esri',
}

const CARTO_LABELS_OPTS: TileLayerOptions = {
  maxZoom: 19,
  subdomains: 'abcd',
  attribution: '&copy; CARTO',
}

export function tilesFor(view: MapView, night: boolean | undefined): TileLayerSpec[] {
  if (view === 'satellite') {
    return [
      { url: ESRI_SAT_URL, opts: ESRI_SAT_OPTS },
      { url: CARTO_LABELS_URL, opts: CARTO_LABELS_OPTS },
    ]
  }
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (token) return [mapboxLayer(night ? MAPBOX_STYLE_NIGHT : MAPBOX_STYLE_DAY, token)]
  return [{ url: OSM_URL, opts: { maxZoom: 19 } }]
}

function mapboxLayer(style: string, token: string): TileLayerSpec {
  return {
    url: `https://api.mapbox.com/styles/v1/mapbox/${style}/tiles/{z}/{x}/{y}@2x?access_token=${token}`,
    opts: { maxZoom: 19, tileSize: 512, zoomOffset: -1 } as TileLayerOptions,
  }
}
