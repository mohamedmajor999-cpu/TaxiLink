import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  formatEur,
  formatKm,
  formatTime,
  formatDate,
  formatDateShort,
  isSameDay,
  getMissionTypeLabel,
  getMissionTypeColors,
  getMinutesUntil,
  getSecondsUntil,
} from '@/lib/utils'

// ─── formatEur ────────────────────────────────────────────────────────────────
describe('formatEur', () => {
  it('formate un montant entier', () => {
    expect(formatEur(50)).toBe('50,00€')
  })

  it('formate un montant décimal', () => {
    expect(formatEur(123.45)).toBe('123,45€')
  })

  it('formate zéro', () => {
    expect(formatEur(0)).toBe('0,00€')
  })

  it('arrondit à 2 décimales', () => {
    expect(formatEur(9.999)).toBe('10,00€')
  })
})

// ─── formatKm ─────────────────────────────────────────────────────────────────
describe('formatKm', () => {
  it('formate une distance entière', () => {
    expect(formatKm(10)).toBe('10.0 km')
  })

  it('formate une distance décimale', () => {
    expect(formatKm(5.75)).toBe('5.8 km')
  })

  it('formate zéro', () => {
    expect(formatKm(0)).toBe('0.0 km')
  })
})

// ─── isSameDay ────────────────────────────────────────────────────────────────
describe('isSameDay', () => {
  it('retourne true pour le même jour', () => {
    const d1 = new Date('2026-04-11T08:00:00')
    const d2 = new Date('2026-04-11T22:30:00')
    expect(isSameDay(d1, d2)).toBe(true)
  })

  it('retourne false pour des jours différents', () => {
    const d1 = new Date('2026-04-11')
    const d2 = new Date('2026-04-12')
    expect(isSameDay(d1, d2)).toBe(false)
  })

  it('retourne false pour des mois différents', () => {
    const d1 = new Date('2026-03-11')
    const d2 = new Date('2026-04-11')
    expect(isSameDay(d1, d2)).toBe(false)
  })

  it('retourne false pour des années différentes', () => {
    const d1 = new Date('2025-04-11')
    const d2 = new Date('2026-04-11')
    expect(isSameDay(d1, d2)).toBe(false)
  })

  it('accepte des strings ISO', () => {
    expect(isSameDay('2026-04-11T10:00:00', '2026-04-11T20:00:00')).toBe(true)
  })
})

// ─── getMissionTypeLabel ──────────────────────────────────────────────────────
describe('getMissionTypeLabel', () => {
  it('retourne "CPAM" pour CPAM', () => {
    expect(getMissionTypeLabel('CPAM')).toBe('CPAM')
  })

  it('retourne "Privé" pour PRIVE', () => {
    expect(getMissionTypeLabel('PRIVE')).toBe('Privé')
  })

  it('retourne "TaxiLink" pour TAXILINK', () => {
    expect(getMissionTypeLabel('TAXILINK')).toBe('TaxiLink')
  })

  it('retourne la valeur brute pour un type inconnu', () => {
    expect(getMissionTypeLabel('INCONNU')).toBe('INCONNU')
  })
})

// ─── getMissionTypeColors ─────────────────────────────────────────────────────
describe('getMissionTypeColors', () => {
  it('retourne les couleurs CPAM', () => {
    const colors = getMissionTypeColors('CPAM')
    expect(colors.bg).toBe('bg-primary/20')
    expect(colors.text).toBe('text-secondary')
  })

  it('retourne les couleurs PRIVE', () => {
    const colors = getMissionTypeColors('PRIVE')
    expect(colors.bg).toBe('bg-secondary/10')
    expect(colors.text).toBe('text-secondary')
  })

  it('retourne les couleurs TAXILINK', () => {
    const colors = getMissionTypeColors('TAXILINK')
    expect(colors.bg).toBe('bg-muted/20')
    expect(colors.text).toBe('text-secondary')
  })

  it('retourne les couleurs par défaut pour un type inconnu', () => {
    const colors = getMissionTypeColors('INCONNU')
    expect(colors.bg).toBe('bg-gray-100')
    expect(colors.text).toBe('text-gray-700')
  })
})

// ─── getMinutesUntil / getSecondsUntil ───────────────────────────────────────
describe('getMinutesUntil', () => {
  it('retourne 0 pour une date passée', () => {
    const past = new Date(Date.now() - 60000).toISOString()
    expect(getMinutesUntil(past)).toBe(0)
  })

  it('retourne le bon nombre de minutes pour une date future', () => {
    const future = new Date(Date.now() + 5 * 60000).toISOString()
    expect(getMinutesUntil(future)).toBeGreaterThanOrEqual(4)
    expect(getMinutesUntil(future)).toBeLessThanOrEqual(5)
  })
})

describe('getSecondsUntil', () => {
  it('retourne 0 pour une date passée', () => {
    const past = new Date(Date.now() - 5000).toISOString()
    expect(getSecondsUntil(past)).toBe(0)
  })

  it('retourne le bon nombre de secondes pour une date future', () => {
    const future = new Date(Date.now() + 30000).toISOString()
    expect(getSecondsUntil(future)).toBeGreaterThanOrEqual(29)
    expect(getSecondsUntil(future)).toBeLessThanOrEqual(30)
  })
})

// ─── formatTime ───────────────────────────────────────────────────────────────
describe('formatTime', () => {
  it('formate une heure ISO en HH:MM', () => {
    const result = formatTime('2026-04-11T14:30:00')
    expect(result).toMatch(/^\d{2}:\d{2}$/)
  })
})

// ─── formatDate ───────────────────────────────────────────────────────────────
describe('formatDate', () => {
  it('retourne une chaîne non vide', () => {
    const result = formatDate('2026-04-11T10:00:00')
    expect(result.length).toBeGreaterThan(0)
  })
})

// ─── formatDateShort ──────────────────────────────────────────────────────────
describe('formatDateShort', () => {
  it('retourne une chaîne courte non vide', () => {
    const result = formatDateShort('2026-04-11T10:00:00')
    expect(result.length).toBeGreaterThan(0)
  })
})
