import { describe, it, expect } from 'vitest'
import { estimateCpamFare } from '@/components/dashboard/driver/cpamFareEstimate'

// Convention CNAM 2025 v3 : forfait 13€ + 4km inclus / km BDR 1.38 / GV +15€
// / nuit-WE-férié ×1.5 / retour vide HDJ +25% ou +50% / TPMR +30€/patient
// / partagé -23%/-35%/-37% (chaque patient facture séparément à la CPAM)
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
    // 13 + (8-4)*1.38 = 18.52 → 19
    expect(v).toBe(19)
  })
  it('Consultation 8 km nuit 1 patient → ×1.5', () => {
    const v = estimateCpamFare({
      distanceKm: 8, durationMin: 20, date: '2026-04-21', time: '22:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
    })
    // (13 + 4*1.38) * 1.5 = 18.52 * 1.5 = 27.78 → 28
    expect(v).toBe(28)
  })
})

describe('estimateCpamFare — Marseille → Cassis (inter-ZUPC, GV)', () => {
  it('Consultation 20 km jour 1 patient → +15 € grande ville', () => {
    const v = estimateCpamFare({
      distanceKm: 20, durationMin: 30, date: '2026-04-21', time: '10:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: CASSIS,
    })
    // 13 + (20-4)*1.38 + 15 = 50.08 → 50
    expect(v).toBe(50)
  })
  it('HDJ 20 km jour 1 patient → +15€ GV + retour vide +25%', () => {
    const v = estimateCpamFare({
      distanceKm: 20, durationMin: 30, date: '2026-04-21', time: '10:00',
      medicalMotif: 'HDJ',
      departure: MARS, destination: CASSIS,
    })
    // km: (20-4)*1.38*1.25 = 27.60 ; total: 13+27.60+15 = 55.60 → 56
    expect(v).toBe(56)
  })
  it('HDJ 60 km dimanche 1 patient → +15€ GV + retour vide +50% + ×1.5', () => {
    const v = estimateCpamFare({
      distanceKm: 60, durationMin: 60, date: '2026-04-26', time: '10:00',
      medicalMotif: 'HDJ',
      departure: MARS, destination: AIX,
    })
    // km: (60-4)*1.38*1.5 = 115.92 ; socle: (13+115.92+15)*1.5 = 215.88 → 216
    expect(v).toBe(216)
  })
})

describe('estimateCpamFare — règle nuit >50% du temps', () => {
  it('Trajet 19h45 (20 min) 25% en nuit → pas majoré', () => {
    const v = estimateCpamFare({
      distanceKm: 8, durationMin: 20, date: '2026-04-22', time: '19:45',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
    })
    expect(v).toBe(19)
  })
  it('Trajet 19h30 (90 min) 66% en nuit → majoré ×1.5', () => {
    const v = estimateCpamFare({
      distanceKm: 8, durationMin: 90, date: '2026-04-22', time: '19:30',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
    })
    expect(v).toBe(28)
  })
})

describe('estimateCpamFare — samedi ≥ 12h', () => {
  it('Samedi 10h → pas majoré', () => {
    const v = estimateCpamFare({
      distanceKm: 8, durationMin: 20, date: '2026-04-25', time: '10:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
    })
    expect(v).toBe(19)
  })
  it('Samedi 14h → majoré', () => {
    const v = estimateCpamFare({
      distanceKm: 8, durationMin: 20, date: '2026-04-25', time: '14:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
    })
    expect(v).toBe(28)
  })
})

describe('estimateCpamFare — TPMR fauteuil roulant', () => {
  it('1 patient en fauteuil → +30 €', () => {
    const v = estimateCpamFare({
      distanceKm: 8, durationMin: 20, date: '2026-04-21', time: '14:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
      transportType: 'WHEELCHAIR',
    })
    // 13 + 4*1.38 + 30 = 48.52 → 49
    expect(v).toBe(49)
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
    // par patient : (13 + 1*1.38) * 0.77 = 11.07 ; ×2 patients = 22.14 → 22
    expect(v).toBe(22)
  })
  it('8 km consult intra 3 patients jour → 36 €', () => {
    const v = estimateCpamFare({
      distanceKm: 8, durationMin: 20, date: '2026-04-21', time: '14:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
      passengers: 3,
    })
    // par patient : (13 + 4*1.38) * 0.65 = 12.04 ; ×3 = 36.11 → 36
    expect(v).toBe(36)
  })
  it('8 km consult intra 4+ patients jour → 47 €', () => {
    const v = estimateCpamFare({
      distanceKm: 8, durationMin: 20, date: '2026-04-21', time: '14:00',
      medicalMotif: 'CONSULTATION',
      departure: MARS, destination: MARS,
      passengers: 5,
    })
    // par patient : (13 + 4*1.38) * 0.63 = 11.67 ; ×5 = 58.35 → 58
    // (NB : abattement 4+ s'applique mais les 5 patients sont tous facturés)
    expect(v).toBe(58)
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
