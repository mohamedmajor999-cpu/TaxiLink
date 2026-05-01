import { describe, it, expect } from 'vitest'
import { computeMarkerPositions } from '@/components/dashboard/driver/home/markerOffset'
import type { Mission } from '@/lib/supabase/types'

const baseMission = (id: string, lat: number, lng: number): Mission => ({
  id,
  departure_lat: lat,
  departure_lng: lng,
} as unknown as Mission)

describe('computeMarkerPositions', () => {
  it('garde la position exacte si une seule annonce', () => {
    const m = baseMission('a', 43.2965, 5.3698)
    const out = computeMarkerPositions([m])
    expect(out.get('a')).toEqual([43.2965, 5.3698])
  })

  it('ignore une annonce sans coordonnees', () => {
    const m = baseMission('a', null as unknown as number, null as unknown as number)
    const out = computeMarkerPositions([m])
    expect(out.has('a')).toBe(false)
  })

  it('decale les annonces qui partagent la meme adresse', () => {
    const m1 = baseMission('a', 43.2965, 5.3698)
    const m2 = baseMission('b', 43.2965, 5.3698)
    const m3 = baseMission('c', 43.2965, 5.3698)
    const out = computeMarkerPositions([m1, m2, m3])
    const p1 = out.get('a')!
    const p2 = out.get('b')!
    const p3 = out.get('c')!
    expect(p1).not.toEqual([43.2965, 5.3698])
    expect(p1).not.toEqual(p2)
    expect(p2).not.toEqual(p3)
    // Toutes proches de l'origine (rayon ~40m)
    for (const [lat, lng] of [p1, p2, p3]) {
      expect(Math.abs(lat - 43.2965)).toBeLessThan(0.001)
      expect(Math.abs(lng - 5.3698)).toBeLessThan(0.001)
    }
  })

  it('placement stable (meme entree → meme sortie)', () => {
    const ms = [baseMission('b', 43.3, 5.4), baseMission('a', 43.3, 5.4)]
    const out1 = computeMarkerPositions(ms)
    const out2 = computeMarkerPositions(ms.slice().reverse())
    expect(out1.get('a')).toEqual(out2.get('a'))
    expect(out1.get('b')).toEqual(out2.get('b'))
  })

  it('annonces a adresses distinctes restent intactes', () => {
    const m1 = baseMission('a', 43.2965, 5.3698)
    const m2 = baseMission('b', 43.5297, 5.4474)
    const out = computeMarkerPositions([m1, m2])
    expect(out.get('a')).toEqual([43.2965, 5.3698])
    expect(out.get('b')).toEqual([43.5297, 5.4474])
  })
})
