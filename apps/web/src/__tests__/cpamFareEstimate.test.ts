import { describe, it, expect } from 'vitest'
import { estimateCpamFare } from '@/components/dashboard/driver/cpamFareEstimate'

// Convention CNAM 2025 v3 : forfait 13€ + 4km inclus / km BDR 1.10 / GV +15€
// / nuit-WE-férié ×1.5 / retour vide HDJ +25% (<50km) ou +50% (≥50km) y compris intra-ZUPC
// / TPMR +30€ par véhicule (×2 si AR) / partagé -23%/-35%/-37% / solo ≥30km -5%
const MARS = 'Gare Saint-Charles, 13001 Marseille'
const AIX = 'Cours Mirabeau, 13100 Aix-en-Provence'
const CASSIS = 'Port de Cassis, 13260 Cassis'

describe('estimateCpamFare — intra-Marseille (intra-ZUPC)', () => {
  it('Consultation 8 km jour 1 patient → pas de GV', () => {
    const v = estimateCpamFare({
      distanceKm: 8, durationMin: 20, date: '2026-04-21', time: '14:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
    })
    // 13 + (8-4)*1.10 = 17.40 → 17
    expect(v).toBe(17)
  })
  it('Consultation 8 km nuit 1 patient → ×1.5', () => {
    const v = estimateCpamFare({
      distanceKm: 8, durationMin: 20, date: '2026-04-21', time: '22:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
    })
    // (13 + 4*1.10) * 1.5 = 17.40 * 1.5 = 26.10 → 26
    expect(v).toBe(26)
  })
})

describe('estimateCpamFare — Marseille → Cassis (inter-ZUPC, GV)', () => {
  it('Consultation 20 km jour 1 patient → +15 € grande ville', () => {
    const v = estimateCpamFare({
      distanceKm: 20, durationMin: 30, date: '2026-04-21', time: '10:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: CASSIS,
    })
    // 13 + (20-4)*1.10 + 15 = 45.60 → 46
    expect(v).toBe(46)
  })
  it('HDJ 20 km jour 1 patient → +15€ GV + retour vide +25%', () => {
    const v = estimateCpamFare({
      distanceKm: 20, durationMin: 30, date: '2026-04-21', time: '10:00',
      medicalMotif: 'HDJ',
      departure: MARS, destination: CASSIS,
    })
    // km: (20-4)*1.10*1.25 = 22.00 ; total: 13+22+15 = 50.00 → 50
    expect(v).toBe(50)
  })
  it('HDJ 60 km dimanche 1 patient → +15€ GV + retour vide +50% + ×1.5 + abattement solo 30km', () => {
    const v = estimateCpamFare({
      distanceKm: 60, durationMin: 60, date: '2026-04-26', time: '10:00',
      medicalMotif: 'HDJ',
      departure: MARS, destination: AIX,
    })
    // km: (60-4)*1.10*1.5 = 92.40 ; socle: (13+92.40+15)*1.5 = 180.60 ; *0.95 (solo ≥30km) = 171.57 → 172
    expect(v).toBe(172)
  })
})

describe('estimateCpamFare — règle nuit >50% du temps', () => {
  it('Trajet 19h45 (20 min) 25% en nuit → pas majoré', () => {
    const v = estimateCpamFare({
      distanceKm: 8, durationMin: 20, date: '2026-04-22', time: '19:45',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
    })
    expect(v).toBe(17)
  })
  it('Trajet 19h30 (90 min) 66% en nuit → majoré ×1.5', () => {
    const v = estimateCpamFare({
      distanceKm: 8, durationMin: 90, date: '2026-04-22', time: '19:30',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
    })
    expect(v).toBe(26)
  })
})

describe('estimateCpamFare — samedi ≥ 12h', () => {
  it('Samedi 10h → pas majoré', () => {
    const v = estimateCpamFare({
      distanceKm: 8, durationMin: 20, date: '2026-04-25', time: '10:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
    })
    expect(v).toBe(17)
  })
  it('Samedi 14h → majoré', () => {
    const v = estimateCpamFare({
      distanceKm: 8, durationMin: 20, date: '2026-04-25', time: '14:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
    })
    expect(v).toBe(26)
  })
})

describe('estimateCpamFare — TPMR fauteuil roulant', () => {
  it('1 patient en fauteuil → +30 € (par véhicule, pas par patient)', () => {
    const v = estimateCpamFare({
      distanceKm: 8, durationMin: 20, date: '2026-04-21', time: '14:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
      transportType: 'WHEELCHAIR',
    })
    // 13 + 4*1.10 + 30 = 47.40 → 47
    expect(v).toBe(47)
  })
  it('TPMR aller-retour → +30 € × 2 = +60 €', () => {
    const v = estimateCpamFare({
      distanceKm: 8, durationMin: 20, date: '2026-04-21', time: '14:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
      transportType: 'WHEELCHAIR',
      returnTrip: true,
    })
    // (13 + 4*1.10) * 2 + 30 * 2 = 34.80 + 60 = 94.80 → 95
    expect(v).toBe(95)
  })
})

describe('estimateCpamFare — transport partagé (multi-patients)', () => {
  // Référence CPAM : chaque patient est facturé séparément avec abattement.
  // Total chauffeur = somme des facturations patient.
  it('5 km HDJ intra 2 patients jour → 22 € (cas validé sur calcul-taxi-conventionne)', () => {
    const v = estimateCpamFare({
      distanceKm: 5, durationMin: 15, date: '2026-04-21', time: '14:00',
      medicalMotif: 'HDJ',
      departure: MARS, destination: MARS,
      passengers: 2,
    })
    // par patient : (13 + 1*1.10*1.25) * 0.77 = 11.07 ; ×2 patients = 22.14 → 22
    expect(v).toBe(22)
  })
  it('8 km consult intra 3 patients jour → 34 €', () => {
    const v = estimateCpamFare({
      distanceKm: 8, durationMin: 20, date: '2026-04-21', time: '14:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
      passengers: 3,
    })
    // par patient : (13 + 4*1.10) * 0.65 = 11.31 ; ×3 = 33.93 → 34
    expect(v).toBe(34)
  })
  it('8 km consult intra 4+ patients jour → 55 €', () => {
    const v = estimateCpamFare({
      distanceKm: 8, durationMin: 20, date: '2026-04-21', time: '14:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
      passengers: 5,
    })
    // par patient : (13 + 4*1.10) * 0.63 = 10.96 ; ×5 = 54.81 → 55
    expect(v).toBe(55)
  })
  it('Plus de patients = plus de revenus chauffeur', () => {
    const args = {
      distanceKm: 8, durationMin: 20, date: '2026-04-21' as const,
      time: '14:00', medicalMotif: 'CONSULTATION' as const,
      departure: MARS, destination: MARS,
    }
    const p1 = estimateCpamFare({ ...args, passengers: 1 })!
    const p2 = estimateCpamFare({ ...args, passengers: 2 })!
    const p3 = estimateCpamFare({ ...args, passengers: 3 })!
    expect(p2).toBeGreaterThan(p1)
    expect(p3).toBeGreaterThan(p2)
  })
})

describe('estimateCpamFare — aller-retour patient', () => {
  it('returnTrip true → ×2 sur le total', () => {
    const args = {
      distanceKm: 8, durationMin: 20, date: '2026-04-21' as const,
      time: '14:00', medicalMotif: 'CONSULTATION' as const,
      departure: MARS, destination: MARS,
    }
    const v1 = estimateCpamFare({ ...args, returnTrip: false })!
    const v2 = estimateCpamFare({ ...args, returnTrip: true })!
    expect(v2).toBeGreaterThanOrEqual(v1 * 2 - 1)
    expect(v2).toBeLessThanOrEqual(v1 * 2 + 1)
  })
})

describe('estimateCpamFare — abattement solo longue distance (≥ 30 km, 1 patient)', () => {
  it('Consult 30 km intra 1 patient → -5%', () => {
    const v = estimateCpamFare({
      distanceKm: 30, durationMin: 40, date: '2026-04-21', time: '14:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
    })
    // 13 + (30-4)*1.10 = 41.60 ; ×0.95 = 39.52 → 40
    expect(v).toBe(40)
  })
  it('Consult 29 km intra 1 patient → pas d’abattement', () => {
    const v = estimateCpamFare({
      distanceKm: 29, durationMin: 40, date: '2026-04-21', time: '14:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
    })
    // 13 + (29-4)*1.10 = 40.50 → 41
    expect(v).toBe(41)
  })
})

describe('estimateCpamFare — retour à vide HDJ même intra-ZUPC', () => {
  it('HDJ 10 km intra-Marseille 1 patient → retour à vide +25% applicable', () => {
    const v = estimateCpamFare({
      distanceKm: 10, durationMin: 20, date: '2026-04-21', time: '14:00',
      medicalMotif: 'HDJ',
      departure: MARS, destination: MARS,
    })
    // km: (10-4)*1.10*1.25 = 8.25 ; total: 13 + 8.25 = 21.25 → 21
    expect(v).toBe(21)
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
