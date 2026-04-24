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
  it('accepte les 11 communes ZUPC (variantes accents/tirets)', () => {
    const ok = [
      'Marseille', 'marseille', 'Aix-en-Provence', 'aix en provence',
      'Arles', 'Aubagne', 'Istres', 'La Ciotat', 'Marignane',
      'Martigues', 'Miramas', 'Salon-de-Provence', 'Vitrolles',
    ]
    for (const c of ok) expect(isInZupcBdr(c)).toBe(true)
  })
  it('rejette les communes hors ZUPC', () => {
    expect(isInZupcBdr('Cassis')).toBe(false)
    expect(isInZupcBdr('Nice')).toBe(false)
    expect(isInZupcBdr('Lyon')).toBe(false)
  })
  it('rejette null/vide', () => {
    expect(isInZupcBdr(null)).toBe(false)
    expect(isInZupcBdr('')).toBe(false)
  })
})

describe('determineReturnMode', () => {
  it('les 2 adresses dans ZUPC → charge', () => {
    expect(determineReturnMode(
      'Gare Saint-Charles, 13001 Marseille',
      'Aéroport Marignane, 13700 Marignane',
    )).toBe('charge')
  })
  it('au moins une hors ZUPC → vide', () => {
    expect(determineReturnMode(
      'Gare Saint-Charles, 13001 Marseille',
      'Port de Cassis, 13260 Cassis',
    )).toBe('vide')
  })
  it('intra-Marseille → charge', () => {
    expect(determineReturnMode(
      'Vieux-Port, 13001 Marseille',
      'Hôpital Nord, 13015 Marseille',
    )).toBe('charge')
  })
  it('adresse ambigüe (chaîne vide) → null', () => {
    expect(determineReturnMode('', 'Marseille')).toBeNull()
    expect(determineReturnMode(null, 'Marseille')).toBeNull()
  })
})
