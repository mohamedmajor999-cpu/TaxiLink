// Décode un polyline Google (format encoded polyline algorithm v1) en coordonnées.
// Retourne une liste [lng, lat] prête pour GeoJSON LineString.
export function decodePolyline(encoded: string): Array<[number, number]> {
  const coords: Array<[number, number]> = []
  let index = 0
  let lat = 0
  let lng = 0
  while (index < encoded.length) {
    let b: number
    let shift = 0
    let result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1
    lat += dlat

    shift = 0
    result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1
    lng += dlng

    coords.push([lng / 1e5, lat / 1e5])
  }
  return coords
}
