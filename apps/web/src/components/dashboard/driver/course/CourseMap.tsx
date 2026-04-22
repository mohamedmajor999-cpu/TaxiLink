'use client'
import { useCourseMap } from './useCourseMap'

interface LatLng { lat: number; lng: number }

interface Props {
  from: LatLng
  to: LatLng
  routeGeometry?: GeoJSON.LineString | null
}

export function CourseMap({ from, to, routeGeometry }: Props) {
  const { containerRef } = useCourseMap({ from, to, routeGeometry })

  return (
    <>
      <div ref={containerRef} className="absolute inset-0" aria-label="Carte de l'itinéraire" />
      <div className="pointer-events-none absolute right-1 bottom-1 z-[400] text-[9px] leading-none text-warm-600/80 bg-paper/70 px-1 py-0.5 rounded">
        © OSM{process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? ' · Mapbox' : ''}
      </div>
    </>
  )
}
