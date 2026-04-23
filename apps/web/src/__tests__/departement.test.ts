import { describe, it, expect } from 'vitest'
import { extractDepartement, isValidDepartement, departementName, ALL_DEPARTEMENTS } from '@/lib/departement'

describe('extractDepartement', () => {
  it('extrait un département métropole depuis une adresse française', () => {
    expect(extractDepartement('10 rue de Rivoli, 75001 Paris')).toBe('75')
    expect(extractDepartement('Lyon 69002')).toBe('69')
    expect(extractDepartement('59000 Lille')).toBe('59')
  })

  it('gère la Corse : 2A (sud) et 2B (nord)', () => {
    expect(extractDepartement('Ajaccio 20000')).toBe('2A')
    expect(extractDepartement('Porto-Vecchio 20137')).toBe('2A')
    expect(extractDepartement('Bastia 20200')).toBe('2B')
    expect(extractDepartement('Calvi 20260')).toBe('2B')
  })

  it('gère les DOM (3 chiffres)', () => {
    expect(extractDepartement('Pointe-à-Pitre 97110')).toBe('971')
    expect(extractDepartement('Fort-de-France 97200')).toBe('972')
    expect(extractDepartement('Cayenne 97300')).toBe('973')
    expect(extractDepartement('Saint-Denis 97400')).toBe('974')
    expect(extractDepartement('Mamoudzou 97600')).toBe('976')
  })

  it('retourne null si aucun code postal', () => {
    expect(extractDepartement('Paris')).toBeNull()
    expect(extractDepartement('')).toBeNull()
    expect(extractDepartement(null)).toBeNull()
    expect(extractDepartement(undefined)).toBeNull()
  })

  it('retourne null pour des codes étrangers à 4 chiffres', () => {
    // Limite connue : un code postal étranger à 5 chiffres coïncidant avec
    // un préfixe de dépt français (ex: Madrid 28000 → 28) sera interprété
    // comme français. L'app est FR-only, donc acceptable.
    expect(extractDepartement('Genève 1201')).toBeNull()
    expect(extractDepartement('Bruxelles 1000')).toBeNull()
  })

  it('retourne null pour des codes 96xxx (non attribué) et 99xxx', () => {
    expect(extractDepartement('Ville imaginaire 96000')).toBeNull()
    expect(extractDepartement('Ailleurs 99999')).toBeNull()
  })

  it('prend le premier code postal si plusieurs', () => {
    expect(extractDepartement('Départ 75001 arrivée 69000')).toBe('75')
  })
})

describe('isValidDepartement', () => {
  it('accepte les 96 dépts métropole + 2A/2B + 8 DOM', () => {
    expect(isValidDepartement('75')).toBe(true)
    expect(isValidDepartement('01')).toBe(true)
    expect(isValidDepartement('2A')).toBe(true)
    expect(isValidDepartement('2B')).toBe(true)
    expect(isValidDepartement('971')).toBe(true)
  })

  it('refuse les codes invalides', () => {
    expect(isValidDepartement('20')).toBe(false)
    expect(isValidDepartement('96')).toBe(false)
    expect(isValidDepartement('99')).toBe(false)
    expect(isValidDepartement('')).toBe(false)
  })
})

describe('ALL_DEPARTEMENTS', () => {
  it('contient 104 codes (94 métropole hors 20 + 2A/2B + 8 DROM-COM)', () => {
    expect(ALL_DEPARTEMENTS.length).toBe(104)
  })

  it('chaque code est unique', () => {
    const codes = ALL_DEPARTEMENTS.map((d) => d.code)
    expect(new Set(codes).size).toBe(codes.length)
  })
})

describe('departementName', () => {
  it('retourne le nom pour un code valide', () => {
    expect(departementName('75')).toBe('Paris')
    expect(departementName('13')).toBe('Bouches-du-Rhône')
    expect(departementName('2A')).toBe('Corse-du-Sud')
    expect(departementName('971')).toBe('Guadeloupe')
  })

  it('retourne null pour un code inconnu', () => {
    expect(departementName('99')).toBeNull()
  })
})
