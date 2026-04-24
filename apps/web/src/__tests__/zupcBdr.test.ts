import { describe, it, expect } from 'vitest'
import { extractCommune, isInZupcBdr, determineReturnMode } from '@/components/dashboard/driver/zupcBdr'

describe('extractCommune', () => {
  it('extrait "Marseille" d\'une adresse avec code postal', () => {
    expect(extractCommune('Hôpital Nord, 13015 Marseille')).toBe('Marseille')
  })
  it('extrait "Aix-en-Provence" correctement', () => {
    expect(extractCommune('Rue Bédarrides, 13100 Aix-en-Provence')).toBe('Aix-en-Provence')
  })
  it('gère le suffixe "France"', () => {
    expect(extractCommune('Place Jean Jaurès, 13001 Marseille France')).toBe('Marseille')
  })
  it('gère le segment ", France" final (format Google Places)', () => {
    expect(extractCommune('6 Avenue Henri Romain Boyer, 6 Av. Henri Romain Boyer, 13015 Marseille, France')).toBe('Marseille')
    expect(extractCommune('Aéroport Marseille Provence (MRS), rd 20, 13700 Marignane, France')).toBe('Marignane')
  })
  it('retourne null pour une entrée vide', () => {
    expect(extractCommune('')).toBeNull()
    expect(extractCommune(null)).toBeNull()
    expect(extractCommune(undefined)).toBeNull()
  })
})

describe('isInZupcBdr', () => {
  it('accepte les communes rattachées à une ZUPC BDR', () => {
    const ok = [
      'Marseille', 'Allauch', 'Plan-de-Cuques', 'Septèmes-les-Vallons',
      'Aix-en-Provence', 'Arles', 'Aubagne', 'Istres', 'La Ciotat',
      'Marignane', 'Martigues', 'Miramas', 'Salon-de-Provence', 'Vitrolles',
    ]
    for (const c of ok) expect(isInZupcBdr(c)).toBe(true)
  })
  it('rejette les communes hors BDR', () => {
    expect(isInZupcBdr('Cassis')).toBe(false)
    expect(isInZupcBdr('Nice')).toBe(false)
    expect(isInZupcBdr('Lyon')).toBe(false)
  })
  it('rejette null/vide', () => {
    expect(isInZupcBdr(null)).toBe(false)
    expect(isInZupcBdr('')).toBe(false)
  })
})

describe('determineReturnMode — intra-ZUPC = charge', () => {
  it('intra-Marseille → charge', () => {
    expect(determineReturnMode(
      'Vieux-Port, 13001 Marseille',
      'Hôpital Nord, 13015 Marseille',
    )).toBe('charge')
  })
  it('Marseille → Allauch (même ZUPC Marseille) → charge', () => {
    expect(determineReturnMode(
      'Gare Saint-Charles, 13001 Marseille',
      'Centre Allauch, 13190 Allauch',
    )).toBe('charge')
  })
  it('Marignane → Vitrolles (même ZUPC aéroport) → charge', () => {
    expect(determineReturnMode(
      'Aéroport, 13700 Marignane',
      'Centre, 13127 Vitrolles',
    )).toBe('charge')
  })
})

describe('determineReturnMode — inter-ZUPC = vide', () => {
  it('Marseille → Marignane (ZUPC différentes) → vide', () => {
    expect(determineReturnMode(
      'Gare Saint-Charles, 13001 Marseille',
      'Aéroport Marseille Provence, 13700 Marignane',
    )).toBe('vide')
  })
  it('Marseille → Aix (ZUPC différentes) → vide', () => {
    expect(determineReturnMode(
      'Vieux-Port, 13001 Marseille',
      'Cours Mirabeau, 13100 Aix-en-Provence',
    )).toBe('vide')
  })
  it('Marseille → Cassis (hors ZUPC BDR) → vide', () => {
    expect(determineReturnMode(
      'Gare Saint-Charles, 13001 Marseille',
      'Port de Cassis, 13260 Cassis',
    )).toBe('vide')
  })
})

describe('determineReturnMode — cas limites', () => {
  it('adresse ambigüe (chaîne vide) → null', () => {
    expect(determineReturnMode('', 'Marseille')).toBeNull()
    expect(determineReturnMode(null, 'Marseille')).toBeNull()
  })
})
