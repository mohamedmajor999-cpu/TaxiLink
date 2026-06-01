import { describe, it, expect } from 'vitest';
import {
  estimateCpamFare,
  estimateMarseilleFare,
  computeDisplayFare,
  extractDepartement,
  extractCommune,
  determineReturnMode,
  isInZupcBdr,
  type MissionLikeFare,
} from '@taxilink/core';

// Tests de la tarification financière (@taxilink/core) — audit M-07.
// Ces fonctions calculent les euros affichés aux chauffeurs (CPAM + Marseille) et
// n'avaient AUCUN test. Valeurs attendues dérivées à la main des constantes
// officielles présentes dans le code (convention CNAM 2025 / arrêté préfectoral BDR).
// Date de référence : 2026-06-15 = lundi (ni dimanche, ni férié, ni nuit à 10:00).

describe('extractDepartement', () => {
  it('métropole : 2 premiers chiffres du code postal', () => {
    expect(extractDepartement('12 rue de la Paix, 13001 Marseille')).toBe('13');
    expect(extractDepartement('75008 Paris')).toBe('75');
    expect(extractDepartement('01000 Bourg-en-Bresse')).toBe('01');
  });
  it('Corse : 20000–20199 → 2A, 20200+ → 2B', () => {
    expect(extractDepartement('20000 Ajaccio')).toBe('2A');
    expect(extractDepartement('20200 Bastia')).toBe('2B');
  });
  it('DROM : code à 3 chiffres 97x', () => {
    expect(extractDepartement('97400 Saint-Denis')).toBe('974');
    expect(extractDepartement('97150 Saint-Martin')).toBe('971'); // 971 dans la table DOM
  });
  it('hors France / sans code postal → null', () => {
    expect(extractDepartement('99999 Nulle-part')).toBeNull(); // 99 > 95
    expect(extractDepartement('aucun code postal ici')).toBeNull();
    expect(extractDepartement(null)).toBeNull();
    expect(extractDepartement(undefined)).toBeNull();
  });
});

describe('extractCommune (guard du fix possibly-undefined)', () => {
  it('retire le code postal de tête et le suffixe France', () => {
    expect(extractCommune('12 rue X, 13001 Marseille')).toBe('Marseille');
    expect(extractCommune('Aix-en-Provence, France')).toBe('Aix-en-Provence');
  });
  it('null / vide → null', () => {
    expect(extractCommune(null)).toBeNull();
    expect(extractCommune('')).toBeNull();
  });
});

describe('ZUPC Bouches-du-Rhône', () => {
  it('isInZupcBdr', () => {
    expect(isInZupcBdr('Marseille')).toBe(true);
    expect(isInZupcBdr('Aix-en-Provence')).toBe(true);
    expect(isInZupcBdr('Lyon')).toBe(false);
  });
  it('determineReturnMode : même ZUPC = charge, inter-ZUPC = vide, inconnu = null', () => {
    expect(determineReturnMode('13001 Marseille', '13002 Marseille')).toBe('charge');
    expect(determineReturnMode('13001 Marseille', '13100 Aix-en-Provence')).toBe('vide');
    expect(determineReturnMode(null, '13001 Marseille')).toBeNull();
  });
});

describe('estimateCpamFare (forfait 13 + 1,10€/km au-delà de 4 km inclus)', () => {
  const base = {
    date: '2026-06-15',
    time: '10:00',
    departure: undefined,
    destination: undefined,
  };

  it('consultation, jour, solo, 10 km → 20€', () => {
    // kmBillable=6 ; kmPart=6*1.10=6.6 ; socle=13+6.6=19.6 ; round=20
    expect(
      estimateCpamFare({ ...base, distanceKm: 10, medicalMotif: 'CONSULTATION' }),
    ).toBe(20);
  });

  it('majoration nuit ×1,5 à 22:00 → 29€', () => {
    // 19.6 * 1.5 = 29.4 → round 29
    expect(
      estimateCpamFare({ ...base, time: '22:00', distanceKm: 10, medicalMotif: 'CONSULTATION' }),
    ).toBe(29);
  });

  it('remise transport partagé 2 patients (-23%) → 30€', () => {
    // perPatient=19.6*0.77=15.092 ; total=*2=30.184 → round 30
    expect(
      estimateCpamFare({ ...base, distanceKm: 10, medicalMotif: 'CONSULTATION', passengers: 2 }),
    ).toBe(30);
  });

  it('HDJ retour à vide court (<50 km) majore le km de 25% → 21€', () => {
    // kmPart=6*1.10*1.25=8.25 ; socle=13+8.25=21.25 → round 21
    expect(
      estimateCpamFare({ ...base, distanceKm: 10, medicalMotif: 'HDJ' }),
    ).toBe(21);
  });

  it('TPMR fauteuil ajoute +30€ (aller simple) → 50€', () => {
    // socle 19.6 + 30 = 49.6 → round 50
    expect(
      estimateCpamFare({ ...base, distanceKm: 10, medicalMotif: 'CONSULTATION', transportType: 'WHEELCHAIR' }),
    ).toBe(50);
  });

  it('aller-retour double le total patient → 39€', () => {
    // 19.6 * 2 = 39.2 → round 39
    expect(
      estimateCpamFare({ ...base, distanceKm: 10, medicalMotif: 'CONSULTATION', returnTrip: true }),
    ).toBe(39);
  });

  it('null si distance ou motif manquant', () => {
    expect(estimateCpamFare({ ...base, distanceKm: null, medicalMotif: 'CONSULTATION' })).toBeNull();
    expect(estimateCpamFare({ ...base, distanceKm: 10, medicalMotif: null })).toBeNull();
    expect(estimateCpamFare({ ...base, date: 'date-invalide', distanceKm: 10, medicalMotif: 'HDJ' })).toBeNull();
  });
});

describe('estimateMarseilleFare (prise en charge 2,40 + tarif/km, min course 8€)', () => {
  const base = { date: '2026-06-15', time: '10:00', departure: undefined, destination: undefined };

  it('jour, retour en charge (tarif A 1,12), 10 km → 14€', () => {
    // 2.40 + 10*1.12 = 13.6 → round 14
    expect(estimateMarseilleFare({ ...base, distanceKm: 10 })).toBe(14);
  });

  it('clamp minimum course à 8€ sur très courte distance', () => {
    // 2.40 + 2*1.12 = 4.64 → round 5 → max(8,5)=8
    expect(estimateMarseilleFare({ ...base, distanceKm: 2 })).toBe(8);
  });

  it('tarif nuit B (1,45) à 22:00, 10 km → 17€', () => {
    // 2.40 + 10*1.45 = 16.9 → round 17
    expect(estimateMarseilleFare({ ...base, time: '22:00', distanceKm: 10 })).toBe(17);
  });

  it('retour à vide explicite (tarif C 2,24), jour, 10 km → 25€', () => {
    // 2.40 + 10*2.24 = 24.8 → round 25
    expect(estimateMarseilleFare({ ...base, distanceKm: 10, returnEmpty: true })).toBe(25);
  });

  it('supplément 5e passager (+4€) → 18€', () => {
    // base 14 + (5-4)*4 = 18
    expect(estimateMarseilleFare({ ...base, distanceKm: 10, passengers: 5 })).toBe(18);
  });
});

describe('computeDisplayFare (prix serveur prioritaire, sinon estimation)', () => {
  const m = (over: Partial<MissionLikeFare>): MissionLikeFare => ({
    price_eur: null,
    type: 'CPAM',
    medical_motif: 'CONSULTATION',
    distance_km: 10,
    duration_min: null,
    static_duration_min: null,
    scheduled_at: '2026-06-15T08:00:00Z', // 10:00 heure de Paris (CEST = UTC+2)
    departure: null,
    destination: null,
    passengers: null,
    transport_type: null,
    return_trip: false,
    ...over,
  });

  it('utilise price_eur stocké quand > 0 (non estimé)', () => {
    expect(computeDisplayFare(m({ price_eur: 42 }))).toEqual({ value: 42, isEstimated: false });
  });

  it('estime quand price_eur absent (CPAM 10 km jour) → 20€ estimé', () => {
    expect(computeDisplayFare(m({ price_eur: null }))).toEqual({ value: 20, isEstimated: true });
  });

  it('retourne 0 non estimé quand aucune estimation possible', () => {
    expect(computeDisplayFare(m({ price_eur: null, type: 'PRIVE', distance_km: null }))).toEqual({
      value: 0,
      isEstimated: false,
    });
  });
});
