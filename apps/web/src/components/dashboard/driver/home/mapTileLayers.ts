// Renvoie la liste des couches a empiler pour la vue demandee. Pour street :
// 1 seule couche (Mapbox ou OSM). Pour satellite : 2 couches — Esri World
// Imagery en base + Esri Reference par-dessus pour les noms de villes/rues
// (sinon le satellite est nu, illisible). Esri en raster CDN rapide.

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
// Reference Esri = couche transparente avec frontieres + noms de villes +
// nombre minimal de rues principales. Concue pour s'empiler sur World Imagery.
const ESRI_REF_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
// Transportation Esri = surcouche routes (autoroutes, routes principales).
// Plus dense que Reference, utile pour reconnaitre la voirie en satellite.
const ESRI_TRANSPORT_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'

const ESRI_RASTER_OPTS: TileLayerOptions = {
  maxZoom: 19,
  attribution: 'Tiles &copy; Esri',
}

export function tilesFor(view: MapView, night: boolean | undefined): TileLayerSpec[] {
  if (view === 'satellite') {
    return [
      { url: ESRI_SAT_URL, opts: ESRI_RASTER_OPTS },
      { url: ESRI_TRANSPORT_URL, opts: ESRI_RASTER_OPTS },
      { url: ESRI_REF_URL, opts: ESRI_RASTER_OPTS },
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
