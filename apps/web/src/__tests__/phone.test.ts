import { describe, it, expect } from 'vitest'
import { waNumber } from '@/lib/phone'

describe('waNumber', () => {
  it('convertit un numéro français "0XYZ" en "33XYZ"', () => {
    expect(waNumber('0612345678')).toBe('33612345678')
  })

  it('garde un numéro déjà international', () => {
    expect(waNumber('+33612345678')).toBe('33612345678')
    expect(waNumber('33612345678')).toBe('33612345678')
  })

  it('strippe les séparateurs (espaces, points, tirets)', () => {
    expect(waNumber('06 12 34 56 78')).toBe('33612345678')
    expect(waNumber('06.12.34.56.78')).toBe('33612345678')
    expect(waNumber('06-12-34-56-78')).toBe('33612345678')
  })

  it('ne convertit pas un numéro qui commence par 0 mais ne fait pas 10 chiffres', () => {
    expect(waNumber('012345')).toBe('012345')
  })
})
