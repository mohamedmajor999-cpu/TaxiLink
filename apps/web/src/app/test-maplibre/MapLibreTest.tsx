'use client'
import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Layers, LocateFixed } from 'lucide-react'

// OpenFreeMap : tuiles vectorielles 100% gratuites, hebergees sur Cloudflare,
// sans cle ni quota. Style "liberty" = Mapbox Streets-like.
// Doc : https://openfreemap.org
const STREET_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

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

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STREET_STYLE,
      center: MARSEILLE,
      zoom: 9,
      pitchWithRotate: false,
      attributionControl: false,
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-left')
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Bascule street/satellite via setStyle
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.setStyle(view === 'street' ? STREET_STYLE : SATELLITE_STYLE)
  }, [view])

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
