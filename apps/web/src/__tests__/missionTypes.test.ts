import { describe, it, expect } from 'vitest'
import {
  TYPE_COLORS,
  TYPE_LABELS,
  MISSION_STATUS_LABELS,
  MISSION_STATUS_COLORS,
  MISSION_TYPES,
} from '@/constants/missionTypes'

describe('TYPE_COLORS', () => {
  it('contient une entrée pour CPAM', () => {
    expect(TYPE_COLORS['CPAM']).toBeDefined()
    expect(TYPE_COLORS['CPAM']).toContain('yellow')
  })

  it('contient une entrée pour PRIVE', () => {
    expect(TYPE_COLORS['PRIVE']).toBeDefined()
    expect(TYPE_COLORS['PRIVE']).toContain('gray')
  })

  it('contient une entrée pour TAXILINK', () => {
    expect(TYPE_COLORS['TAXILINK']).toBeDefined()
    expect(TYPE_COLORS['TAXILINK']).toContain('blue')
  })
})

describe('TYPE_LABELS', () => {
  it('retourne "CPAM" pour CPAM', () => {
    expect(TYPE_LABELS['CPAM']).toBe('CPAM')
  })

  it('retourne "Privé" pour PRIVE', () => {
    expect(TYPE_LABELS['PRIVE']).toBe('Privé')
  })

  it('retourne "TaxiLink" pour TAXILINK', () => {
    expect(TYPE_LABELS['TAXILINK']).toBe('TaxiLink')
  })

  it('retourne "Toutes" pour ALL', () => {
    expect(TYPE_LABELS['ALL']).toBe('Toutes')
  })
})

describe('MISSION_STATUS_LABELS', () => {
  it('couvre tous les statuts', () => {
    expect(MISSION_STATUS_LABELS['AVAILABLE']).toBeDefined()
    expect(MISSION_STATUS_LABELS['IN_PROGRESS']).toBeDefined()
    expect(MISSION_STATUS_LABELS['DONE']).toBeDefined()
    expect(MISSION_STATUS_LABELS['CANCELLED']).toBeDefined()
  })
})

describe('MISSION_STATUS_COLORS', () => {
  it('couvre tous les statuts', () => {
    expect(MISSION_STATUS_COLORS['AVAILABLE']).toBeDefined()
    expect(MISSION_STATUS_COLORS['IN_PROGRESS']).toBeDefined()
    expect(MISSION_STATUS_COLORS['DONE']).toBeDefined()
    expect(MISSION_STATUS_COLORS['CANCELLED']).toBeDefined()
  })
})

describe('MISSION_TYPES', () => {
  it('contient 4 types', () => {
    expect(MISSION_TYPES).toHaveLength(4)
  })

  it('contient ALL, CPAM, PRIVE, TAXILINK', () => {
    expect(MISSION_TYPES).toContain('ALL')
    expect(MISSION_TYPES).toContain('CPAM')
    expect(MISSION_TYPES).toContain('PRIVE')
    expect(MISSION_TYPES).toContain('TAXILINK')
  })
})
