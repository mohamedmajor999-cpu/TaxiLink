'use client'
import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Layers, LocateFixed } from 'lucide-react'

// OpenFreeMap : tuiles vectorielles 100% gratuites, hebergees sur Cloudflare,
// sans cle ni quota. 4 styles dispos pour comparer le rendu.
// Doc : https://openfreemap.org
type StyleKey = 'liberty' | 'bright' | 'positron' | 'dark'

const STREET_STYLES: { key: StyleKey; label: string; url: string; hint: string }[] = [
  {
    key: 'liberty', label: 'Liberty',
    url: 'https://tiles.openfreemap.org/styles/liberty',
    hint: 'Style Mapbox Streets — équilibré',
  },
  {
    key: 'bright', label: 'Bright',
    url: 'https://tiles.openfreemap.org/styles/bright',
    hint: 'Couleurs vives, plus de POI visibles',
  },
  {
    key: 'positron', label: 'Positron',
    url: 'https://tiles.openfreemap.org/styles/positron',
    hint: 'Très light, minimaliste — bon pour overlays',
  },
  {
    key: 'dark', label: 'Dark',
    url: 'https://tiles.openfreemap.org/styles/dark',
    hint: 'Mode nuit',
  },
]

// Force les labels en francais sur tous les layers symbol qui ont un text-field.
function localizeLabelsToFrench(map: maplibregl.Map) {
  const layers = map.getStyle().layers ?? []
  for (const layer of layers) {
    if (layer.type !== 'symbol') continue
    const textField = (layer.layout as { 'text-field'?: unknown })?.['text-field']
    if (!textField) continue
    map.setLayoutProperty(layer.id, 'text-field', [
      'coalesce',
      ['get', 'name:fr'],
      ['get', 'name:latin'],
      ['get', 'name'],
    ])
  }
}

// Satellite : Esri World Imagery via custom style MapLibre. Pas de cle.
const SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    esri: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      attribution: '© Esri',
    },
  },
  layers: [{ id: 'esri', type: 'raster', source: 'esri' }],
}

const MARSEILLE: [number, number] = [5.3698, 43.2965] // [lng, lat] !

export function MapLibreTest() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [view, setView] = useState<'street' | 'satellite'>('street')
  const [styleKey, setStyleKey] = useState<StyleKey>('liberty')

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STREET_STYLES[0].url,
      center: MARSEILLE,
      zoom: 11,
      pitchWithRotate: false,
      attributionControl: false,
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-left')
    map.on('style.load', () => localizeLabelsToFrench(map))
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Bascule style street/satellite OU change de style street
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (view === 'satellite') {
      map.setStyle(SATELLITE_STYLE)
    } else {
      const cfg = STREET_STYLES.find((s) => s.key === styleKey) ?? STREET_STYLES[0]
      map.setStyle(cfg.url)
    }
  }, [view, styleKey])

  const recenter = () => {
    const map = mapRef.current
    if (!map) return
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      map.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 14 })
    })
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Picker de style en haut */}
      {view === 'street' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] flex gap-1.5 bg-white/95 backdrop-blur rounded-full p-1.5 shadow-[0_4px_14px_rgba(0,0,0,0.15)]">
          {STREET_STYLES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStyleKey(s.key)}
              title={s.hint}
              className={[
                'px-3 h-8 rounded-full text-[12px] font-bold transition-colors',
                styleKey === s.key
                  ? 'bg-ink text-paper'
                  : 'bg-paper text-ink hover:bg-warm-50',
              ].join(' ')}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={recenter}
        aria-label="Localiser"
        className="absolute bottom-[22px] right-3 z-[500] w-11 h-11 rounded-full bg-white border border-warm-200 shadow-[0_4px_14px_rgba(0,0,0,0.2)] flex items-center justify-center text-ink hover:bg-warm-50 active:scale-95 transition-transform"
      >
        <LocateFixed className="w-5 h-5" strokeWidth={2} />
      </button>
      <button
        type="button"
        onClick={() => setView((v) => (v === 'street' ? 'satellite' : 'street'))}
        aria-label={view === 'satellite' ? 'Vue plan' : 'Vue satellite'}
        aria-pressed={view === 'satellite'}
        className="absolute bottom-[126px] right-3 z-[500] w-11 h-11 rounded-full bg-white border border-warm-200 shadow-[0_4px_14px_rgba(0,0,0,0.2)] flex items-center justify-center text-ink hover:bg-warm-50 active:scale-95 transition-transform"
      >
        <Layers className="w-5 h-5" strokeWidth={view === 'satellite' ? 2.4 : 2} />
      </button>
    </div>
  )
}
