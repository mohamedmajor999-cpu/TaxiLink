import { describe, it, expect } from 'vitest'
import { estimateMarseilleFare, estimateMarseilleFareRange } from '@/components/dashboard/driver/marseilleFareEstimate'

// v2026 : PC 2,40 € / A 1,12 / B 1,45 / C 2,24 / D 2,90 / horaire 35,60 / min 8
const MARS = 'Gare Saint-Charles, 13001 Marseille'
const AIX = 'Place Jeanne d\'Arc, 13100 Aix-en-Provence'
const CASSIS = 'Port de Cassis, 13260 Cassis'

describe('estimateMarseilleFare — tarif A (jour, retour charge = intra-ZUPC)', () => {
  it('10 km intra-Marseille jour → 2.40 + 10*1.12 = 13.60 → arrondi 14 €', () => {
    const v = estimateMarseilleFare({
      distanceKm: 10, date: '2026-04-21', time: '10:00',
      durationMin: 20, staticDurationMin: 20,
      departure: MARS, destination: MARS,
    })
    expect(v).toBe(14)
  })
})

describe('estimateMarseilleFare — tarif C (jour, retour vide = inter-ZUPC)', () => {
  it('Marseille → Aix (ZUPC différentes) → tarif C', () => {
    const v = estimateMarseilleFare({
      distanceKm: 30, date: '2026-04-21', time: '10:00',
      durationMin: 30, staticDurationMin: 30,
      departure: MARS, destination: AIX,
    })
    // 2.40 + 30*2.24 = 69.60 → 70 €
    expect(v).toBe(70)
  })
  it('Marseille → Cassis (hors ZUPC BDR) → tarif C', () => {
    const v = estimateMarseilleFare({
      distanceKm: 20, date: '2026-04-21', time: '10:00',
      durationMin: 30, staticDurationMin: 30,
      departure: MARS, destination: CASSIS,
    })
    // 2.40 + 20*2.24 = 47.20 → 47 €
    expect(v).toBe(47)
  })
  it('Marseille → Marignane (ZUPC différentes) 21.2 km → 50 € (cas mission 030fe0a9)', () => {
    const v = estimateMarseilleFare({
      distanceKm: 21.2, date: '2026-04-24', time: '14:00',
      durationMin: 22, staticDurationMin: 22,
      departure: '6 Av. Henri Romain Boyer, 13015 Marseille, France',
      destination: 'Aéroport Marseille Provence, 13700 Marignane, France',
    })
    // 2.40 + 21.2*2.24 = 49.89 → 50 €
    expect(v).toBe(50)
  })
})

describe('estimateMarseilleFare — tarif B (AR nuit)', () => {
  it('Intra-Marseille à 22h → tarif B', () => {
    const v = estimateMarseilleFare({
      distanceKm: 10, date: '2026-04-21', time: '22:00',
      durationMin: 20, staticDurationMin: 20,
      departure: MARS, destination: MARS,
    })
    // 2.40 + 10*1.45 = 16.90 → 17 €
    expect(v).toBe(17)
  })
  it('Dimanche 10h intra-Marseille → tarif B', () => {
    const v = estimateMarseilleFare({
      distanceKm: 10, date: '2026-04-26', time: '10:00',
      durationMin: 20, staticDurationMin: 20,
      departure: MARS, destination: MARS,
    })
    expect(v).toBe(17)
  })
})

describe('estimateMarseilleFare — tarif D (AS nuit)', () => {
  it('Marseille → Cassis à 22h → tarif D', () => {
    const v = estimateMarseilleFare({
      distanceKm: 15, date: '2026-04-21', time: '22:00',
      durationMin: 25, staticDurationMin: 25,
      departure: MARS, destination: CASSIS,
    })
    // 2.40 + 15*2.90 = 45.90 → 46 €
    expect(v).toBe(46)
  })
})

describe('estimateMarseilleFare — course minimum', () => {
  it('2 km intra-Marseille jour → min 8 €', () => {
    const v = estimateMarseilleFare({
      distanceKm: 2, date: '2026-04-21', time: '10:00',
      durationMin: 5, staticDurationMin: 5,
      departure: MARS, destination: MARS,
    })
    // 2.40 + 2*1.12 = 4.64 → min 8
    expect(v).toBe(8)
  })
})

describe('estimateMarseilleFare — supplément trafic (vraie formule)', () => {
  it('20 min perdus intra-Marseille = 35.60 * 20/60 = 11.87 € ajoutés', () => {
    const v = estimateMarseilleFare({
      distanceKm: 10, date: '2026-04-21', time: '10:00',
      durationMin: 40, staticDurationMin: 20,
      departure: MARS, destination: MARS,
    })
    // 2.40 + 10*1.12 + 35.60 * 20/60 = 2.40 + 11.20 + 11.87 = 25.47 → 25 €
    expect(v).toBe(25)
  })
  it('sans staticDuration → fallback legacy (facteur 0.60)', () => {
    const withStatic = estimateMarseilleFare({
      distanceKm: 10, date: '2026-04-21', time: '10:00',
      durationMin: 40, staticDurationMin: 20,
      departure: MARS, destination: MARS,
    })
    const withoutStatic = estimateMarseilleFare({
      distanceKm: 10, date: '2026-04-21', time: '10:00',
      durationMin: 40,
      departure: MARS, destination: MARS,
    })
    // fallback non-null quand il y a un différentiel
    expect(withoutStatic).not.toBeNull()
    // la vraie formule donne une valeur différente du fallback
    expect(withStatic).not.toBe(withoutStatic)
  })
})

describe('estimateMarseilleFareRange — fourchette vs prix exact', () => {
  it('Intra-Marseille → prix exact tarif A (min = max)', () => {
    const r = estimateMarseilleFareRange({
      distanceKm: 10, date: '2026-04-21', time: '10:00',
      durationMin: 20, staticDurationMin: 20,
      departure: MARS, destination: MARS,
    })
    expect(r).not.toBeNull()
    expect(r!.min).toBe(r!.max)
    expect(r!.min).toBe(14)
  })
  it('Marseille → Cassis jour → tarif C exact', () => {
    const r = estimateMarseilleFareRange({
      distanceKm: 20, date: '2026-04-21', time: '10:00',
      durationMin: 30, staticDurationMin: 30,
      departure: MARS, destination: CASSIS,
    })
    expect(r).not.toBeNull()
    expect(r!.min).toBe(r!.max)
    expect(r!.min).toBe(47)
  })
  it('adresses absentes → fourchette AR/AS', () => {
    const r = estimateMarseilleFareRange({
      distanceKm: 10, date: '2026-04-21', time: '10:00',
      durationMin: 20, staticDurationMin: 20,
    })
    expect(r).not.toBeNull()
    expect(r!.min).toBeLessThan(r!.max)
  })
})
