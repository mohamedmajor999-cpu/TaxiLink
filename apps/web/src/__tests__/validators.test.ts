import { describe, it, expect } from 'vitest'
import { validateMission, isValidPhone, isValidEmail, isValidPassword } from '@/lib/validators'

// ─── validateMission ──────────────────────────────────────────────────────────
describe('validateMission', () => {
  const base = {
    type: 'PRIVE' as const,
    departure: '10 rue de la Paix, Paris',
    destination: 'Gare du Nord, Paris',
    price_eur: 25,
    distance_km: 5,
    duration_min: 15,
  }

  it('valide une mission correcte sans erreur', () => {
    expect(validateMission(base)).toHaveLength(0)
  })

  // Départ
  it('erreur si départ vide', () => {
    const errors = validateMission({ ...base, departure: '' })
    expect(errors.some(e => e.field === 'departure')).toBe(true)
  })

  it('erreur si départ trop court', () => {
    const errors = validateMission({ ...base, departure: 'abc' })
    expect(errors.some(e => e.field === 'departure')).toBe(true)
  })

  // Destination
  it('erreur si destination vide', () => {
    const errors = validateMission({ ...base, destination: '' })
    expect(errors.some(e => e.field === 'destination')).toBe(true)
  })

  it('erreur si départ = destination', () => {
    const errors = validateMission({ ...base, departure: 'Paris', destination: 'Paris' })
    expect(errors.some(e => e.field === 'destination')).toBe(true)
  })

  // Prix
  it('erreur si prix négatif', () => {
    const errors = validateMission({ ...base, price_eur: -5 })
    expect(errors.some(e => e.field === 'price_eur')).toBe(true)
  })

  it('erreur si prix > 500', () => {
    const errors = validateMission({ ...base, price_eur: 501 })
    expect(errors.some(e => e.field === 'price_eur')).toBe(true)
  })

  it('accepte prix = 0', () => {
    const errors = validateMission({ ...base, price_eur: 0 })
    expect(errors.some(e => e.field === 'price_eur')).toBe(false)
  })

  // Distance
  it('erreur si distance <= 0', () => {
    const errors = validateMission({ ...base, distance_km: 0 })
    expect(errors.some(e => e.field === 'distance_km')).toBe(true)
  })

  it('erreur si distance > 1000', () => {
    const errors = validateMission({ ...base, distance_km: 1001 })
    expect(errors.some(e => e.field === 'distance_km')).toBe(true)
  })

  // Téléphone
  it('erreur si téléphone invalide', () => {
    const errors = validateMission({ ...base, phone: '123' })
    expect(errors.some(e => e.field === 'phone')).toBe(true)
  })

  it('accepte un téléphone français valide', () => {
    const errors = validateMission({ ...base, phone: '0601020304' })
    expect(errors.some(e => e.field === 'phone')).toBe(false)
  })

  it('accepte un téléphone +33 valide', () => {
    const errors = validateMission({ ...base, phone: '+33601020304' })
    expect(errors.some(e => e.field === 'phone')).toBe(false)
  })

  // CPAM — patient obligatoire
  it('erreur CPAM sans nom patient', () => {
    const errors = validateMission({ ...base, type: 'CPAM', patient_name: '' })
    expect(errors.some(e => e.field === 'patient_name')).toBe(true)
  })

  it('CPAM valide avec nom patient', () => {
    const errors = validateMission({ ...base, type: 'CPAM', patient_name: 'Jean Dupont' })
    expect(errors.some(e => e.field === 'patient_name')).toBe(false)
  })

  // Notes
  it('erreur si notes > 500 caractères', () => {
    const errors = validateMission({ ...base, notes: 'a'.repeat(501) })
    expect(errors.some(e => e.field === 'notes')).toBe(true)
  })

  it('accepte des notes de 500 caractères', () => {
    const errors = validateMission({ ...base, notes: 'a'.repeat(500) })
    expect(errors.some(e => e.field === 'notes')).toBe(false)
  })
})

// ─── isValidPhone ─────────────────────────────────────────────────────────────
describe('isValidPhone', () => {
  it('accepte 0601020304', () => expect(isValidPhone('0601020304')).toBe(true))
  it('accepte +33601020304', () => expect(isValidPhone('+33601020304')).toBe(true))
  it('rejette 123', () => expect(isValidPhone('123')).toBe(false))
  it('rejette un numéro commençant par 0', () => expect(isValidPhone('0001020304')).toBe(false))
})

// ─── isValidEmail ─────────────────────────────────────────────────────────────
describe('isValidEmail', () => {
  it('accepte un email valide', () => expect(isValidEmail('test@example.com')).toBe(true))
  it('rejette un email sans @', () => expect(isValidEmail('testexample.com')).toBe(false))
  it('rejette un email sans domaine', () => expect(isValidEmail('test@')).toBe(false))
})

// ─── isValidPassword ──────────────────────────────────────────────────────────
describe('isValidPassword', () => {
  it('accepte un mot de passe >= 8 caractères', () => expect(isValidPassword('12345678')).toBe(true))
  it('rejette un mot de passe < 8 caractères', () => expect(isValidPassword('1234567')).toBe(false))
  it('rejette une chaîne vide', () => expect(isValidPassword('')).toBe(false))
})
