import { describe, it, expect } from 'vitest'
import { estimateCpamFare } from '@/components/dashboard/driver/cpamFareEstimate'

// Convention CNAM 2025 v2 : forfait 13€ + 4km inclus / km BDR 1.22 / GV +15€
// / nuit-WE-férié ×1.5 / retour vide HDJ +25% ou +50% / TPMR +30€
// / partagé -23%/-35%/-37%
const MARS = 'Gare Saint-Charles, 13001 Marseille'
const AIX = 'Cours Mirabeau, 13100 Aix-en-Provence'
const CASSIS = 'Port de Cassis, 13260 Cassis'

describe('estimateCpamFare — intra-Marseille (intra-ZUPC)', () => {
  it('Consultation 8 km jour → pas de grande ville (même ZUPC) = 18 €', () => {
    const v = estimateCpamFare({
      distanceKm: 8, durationMin: 20, date: '2026-04-21', time: '14:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
    })
    // 13 + (8-4)*1.22 = 17.88 → 18 (pas de GV car intra-ZUPC, pas de majoration)
    expect(v).toBe(18)
  })
  it('Consultation 8 km nuit → ×1.5', () => {
    const v = estimateCpamFare({
      distanceKm: 8, durationMin: 20, date: '2026-04-21', time: '22:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
    })
    // (13 + 4*1.22) * 1.5 = 17.88 * 1.5 = 26.82 → 27
    expect(v).toBe(27)
  })
})

describe('estimateCpamFare — Marseille → Cassis (inter-ZUPC, GV)', () => {
  it('Consultation 20 km jour → +15 € grande ville', () => {
    const v = estimateCpamFare({
      distanceKm: 20, durationMin: 30, date: '2026-04-21', time: '10:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: CASSIS,
    })
    // 13 + (20-4)*1.22 + 15 = 47.52 → 48
    expect(v).toBe(48)
  })
  it('HDJ 20 km jour → +15€ GV + retour à vide +25%', () => {
    const v = estimateCpamFare({
      distanceKm: 20, durationMin: 30, date: '2026-04-21', time: '10:00',
      medicalMotif: 'HDJ',
      departure: MARS, destination: CASSIS,
    })
    // km: (20-4)*1.22*1.25 = 24.40 ; total: 13+24.40+15 = 52.40 → 52
    expect(v).toBe(52)
  })
  it('HDJ 60 km dimanche → +15€ GV + retour à vide +50% + ×1.5 (dimanche)', () => {
    const v = estimateCpamFare({
      distanceKm: 60, durationMin: 60, date: '2026-04-26', time: '10:00',
      medicalMotif: 'HDJ',
      departure: MARS, destination: AIX,
    })
    // km: (60-4)*1.22*1.5 = 102.48 ; socle: (13+102.48+15)*1.5 = 195.72 → 196
    expect(v).toBe(196)
  })
})

describe('estimateCpamFare — règle nuit >50% du temps', () => {
  it('Trajet 19h45 (20 min) 10 min en nuit sur 20 → pas majoré', () => {
    const v = estimateCpamFare({
      distanceKm: 8, durationMin: 20, date: '2026-04-22', time: '19:45',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
    })
    // 15min avant 20h + 5min après → 5/20 = 25% en nuit → pas majoré
    expect(v).toBe(18)
  })
  it('Trajet 19h30 (90 min) plus de 50% en nuit → majoré', () => {
    const v = estimateCpamFare({
      distanceKm: 8, durationMin: 90, date: '2026-04-22', time: '19:30',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
    })
    // 30min avant 20h + 60min après = 60/90 = 66% nuit → majoré ×1.5
    expect(v).toBe(27)
  })
})

describe('estimateCpamFare — samedi ≥ 12h', () => {
  it('Samedi 10h → pas majoré', () => {
    const v = estimateCpamFare({
      distanceKm: 8, durationMin: 20, date: '2026-04-25', time: '10:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
    })
    expect(v).toBe(18)
  })
  it('Samedi 14h → majoré', () => {
    const v = estimateCpamFare({
      distanceKm: 8, durationMin: 20, date: '2026-04-25', time: '14:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
    })
    expect(v).toBe(27)
  })
})

describe('estimateCpamFare — suppléments TPMR et transport partagé', () => {
  it('Fauteuil roulant → +30 € (non soumis majoration/abattement)', () => {
    const v = estimateCpamFare({
      distanceKm: 8, durationMin: 20, date: '2026-04-21', time: '14:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
      transportType: 'WHEELCHAIR',
    })
    // 17.88 + 30 = 47.88 → 48
    expect(v).toBe(48)
  })
  it('2 patients partagé → -23% sur socle', () => {
    const v = estimateCpamFare({
      distanceKm: 8, durationMin: 20, date: '2026-04-21', time: '14:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
      passengers: 2,
    })
    // 17.88 * (1 - 0.23) = 13.77 → 14
    expect(v).toBe(14)
  })
  it('4+ patients partagé → -37% sur socle', () => {
    const v = estimateCpamFare({
      distanceKm: 8, durationMin: 20, date: '2026-04-21', time: '14:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
      passengers: 5,
    })
    // 17.88 * (1 - 0.37) = 11.26 → 11
    expect(v).toBe(11)
  })
})

describe('estimateCpamFare — aller-retour', () => {
  it('returnTrip true → ×2', () => {
    const v1 = estimateCpamFare({
      distanceKm: 8, durationMin: 20, date: '2026-04-21', time: '14:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
      returnTrip: false,
    })
    const v2 = estimateCpamFare({
      distanceKm: 8, durationMin: 20, date: '2026-04-21', time: '14:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
      returnTrip: true,
    })
    expect(v1).toBe(18)
    expect(v2).toBe(36) // 17.88 * 2 = 35.76 → 36
  })
})

describe('estimateCpamFare — null quand input invalide', () => {
  it('distance null → null', () => {
    expect(estimateCpamFare({
      distanceKm: null, date: '2026-04-21', time: '14:00',
      medicalMotif: 'CONSULTATION',
    })).toBeNull()
  })
  it('medicalMotif null → null', () => {
    expect(estimateCpamFare({
      distanceKm: 8, date: '2026-04-21', time: '14:00',
      medicalMotif: null,
    })).toBeNull()
  })
})
