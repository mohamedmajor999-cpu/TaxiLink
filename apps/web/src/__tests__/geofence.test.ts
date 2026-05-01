import { describe, it, expect } from 'vitest'
import {
  haversineMeters,
  reduceDwell,
  checkGeofence,
  INITIAL_DWELL,
} from '@/lib/geofence'

describe('haversineMeters', () => {
  it('retourne 0 pour 2 points identiques', () => {
    const p = { lat: 43.2965, lng: 5.3698 }
    expect(haversineMeters(p, p)).toBe(0)
  })

  it('approxime correctement Paris ↔ Marseille (~660 km)', () => {
    const paris = { lat: 48.8566, lng: 2.3522 }
    const marseille = { lat: 43.2965, lng: 5.3698 }
    const km = haversineMeters(paris, marseille) / 1000
    expect(km).toBeGreaterThan(650)
    expect(km).toBeLessThan(670)
  })

  it('approxime correctement 100m sur un même méridien', () => {
    const a = { lat: 43.2965, lng: 5.3698 }
    const b = { lat: 43.2965 + 100 / 111_000, lng: 5.3698 } // ~111km par degré de lat
    const d = haversineMeters(a, b)
    expect(d).toBeGreaterThan(95)
    expect(d).toBeLessThan(105)
  })
})

describe('reduceDwell', () => {
  const T0 = 1_000_000
  const DWELL = 60_000 // 1 minute pour les tests

  it('reste outside quand on n\'est pas dans la zone', () => {
    const next = reduceDwell({ state: INITIAL_DWELL, isInside: false, now: T0, dwellMs: DWELL })
    expect(next).toEqual(INITIAL_DWELL)
  })

  it('passe à entering la première fois qu\'on entre dans la zone', () => {
    const next = reduceDwell({ state: INITIAL_DWELL, isInside: true, now: T0, dwellMs: DWELL })
    expect(next.phase).toBe('entering')
    expect(next.enteredAt).toBe(T0)
  })

  it('reste entering tant que la durée minimale n\'est pas atteinte', () => {
    const s1 = reduceDwell({ state: INITIAL_DWELL, isInside: true, now: T0, dwellMs: DWELL })
    const s2 = reduceDwell({ state: s1, isInside: true, now: T0 + 30_000, dwellMs: DWELL })
    expect(s2.phase).toBe('entering')
    expect(s2.enteredAt).toBe(T0)
  })

  it('passe à confirmed quand la durée minimale est atteinte', () => {
    const s1 = reduceDwell({ state: INITIAL_DWELL, isInside: true, now: T0, dwellMs: DWELL })
    const s2 = reduceDwell({ state: s1, isInside: true, now: T0 + DWELL, dwellMs: DWELL })
    expect(s2.phase).toBe('confirmed')
    expect(s2.enteredAt).toBe(T0)
  })

  it('reset complet si on sort de la zone (anti-jitter inversé : on doit re-attendre)', () => {
    const s1 = reduceDwell({ state: INITIAL_DWELL, isInside: true, now: T0, dwellMs: DWELL })
    const s2 = reduceDwell({ state: s1, isInside: false, now: T0 + 30_000, dwellMs: DWELL })
    expect(s2).toEqual(INITIAL_DWELL)
  })

  it('reste confirmed une fois la zone validée (tant qu\'on reste dedans)', () => {
    const s1 = reduceDwell({ state: INITIAL_DWELL, isInside: true, now: T0, dwellMs: DWELL })
    const s2 = reduceDwell({ state: s1, isInside: true, now: T0 + DWELL, dwellMs: DWELL })
    const s3 = reduceDwell({ state: s2, isInside: true, now: T0 + DWELL + 999_999, dwellMs: DWELL })
    expect(s3.phase).toBe('confirmed')
  })
})

describe('checkGeofence', () => {
  const HOPITAL = { lat: 43.3046, lng: 5.4035 } // arbitraire Marseille
  const T0 = 1_000_000

  it('justConfirmed=false tant qu\'on n\'est pas reste assez longtemps', () => {
    let state = INITIAL_DWELL
    const r1 = checkGeofence({
      state, position: HOPITAL, target: HOPITAL,
      radiusM: 80, dwellMs: 60_000, now: T0,
    })
    state = r1.state
    expect(r1.justConfirmed).toBe(false)
    expect(state.phase).toBe('entering')

    const r2 = checkGeofence({
      state, position: HOPITAL, target: HOPITAL,
      radiusM: 80, dwellMs: 60_000, now: T0 + 30_000,
    })
    expect(r2.justConfirmed).toBe(false)
  })

  it('justConfirmed=true exactement une fois quand le seuil dwell est franchi', () => {
    let state = INITIAL_DWELL
    state = checkGeofence({
      state, position: HOPITAL, target: HOPITAL,
      radiusM: 80, dwellMs: 60_000, now: T0,
    }).state
    const r2 = checkGeofence({
      state, position: HOPITAL, target: HOPITAL,
      radiusM: 80, dwellMs: 60_000, now: T0 + 60_000,
    })
    expect(r2.justConfirmed).toBe(true)

    // Tick suivant : déjà confirmed → ne déclenche plus
    const r3 = checkGeofence({
      state: r2.state, position: HOPITAL, target: HOPITAL,
      radiusM: 80, dwellMs: 60_000, now: T0 + 70_000,
    })
    expect(r3.justConfirmed).toBe(false)
  })

  it('hors zone → state reset, distanceM rendue', () => {
    const FARAWAY = { lat: 48.8566, lng: 2.3522 } // Paris
    const r = checkGeofence({
      state: INITIAL_DWELL, position: FARAWAY, target: HOPITAL,
      radiusM: 80, dwellMs: 60_000, now: T0,
    })
    expect(r.state).toEqual(INITIAL_DWELL)
    expect(r.distanceM).toBeGreaterThan(100_000)
  })
})
