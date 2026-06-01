import { describe, it, expect } from 'vitest'
import { isLikelyHallucination } from '@/lib/openai/whisperHallucinations'

describe('isLikelyHallucination', () => {
  it('rejette les transcripts vides', () => {
    expect(isLikelyHallucination('')).toBe(true)
    expect(isLikelyHallucination('   ')).toBe(true)
  })

  it('rejette les hallucinations FR classiques de Whisper sur silence', () => {
    expect(isLikelyHallucination('Merci')).toBe(true)
    expect(isLikelyHallucination('Merci.')).toBe(true)
    expect(isLikelyHallucination("Merci d'avoir regardé")).toBe(true)
    expect(isLikelyHallucination("Sous-titres réalisés par la communauté d'Amara.org")).toBe(true)
    expect(isLikelyHallucination('Bonjour')).toBe(true)
    expect(isLikelyHallucination('Au revoir')).toBe(true)
    expect(isLikelyHallucination('...')).toBe(true)
    expect(isLikelyHallucination('[Musique]')).toBe(true)
  })

  it('rejette une suite tres courte de tokens parasites', () => {
    expect(isLikelyHallucination('Oui')).toBe(true)
    expect(isLikelyHallucination('Non.')).toBe(true)
    expect(isLikelyHallucination('Voila')).toBe(true)
  })

  it('accepte un vrai transcript de course (meme court)', () => {
    expect(isLikelyHallucination('Course pour la Timone à 14h')).toBe(false)
    expect(isLikelyHallucination('Dialyse demain matin')).toBe(false)
    expect(isLikelyHallucination('De Gare Saint-Charles à aéroport Marignane')).toBe(false)
  })

  it('accepte un transcript long meme si bizarre', () => {
    expect(isLikelyHallucination(
      'Je vais de Marseille la République jusqu\'à Aubagne demain matin',
    )).toBe(false)
  })

  it('est insensible a la casse et aux accents', () => {
    expect(isLikelyHallucination('MERCI')).toBe(true)
    expect(isLikelyHallucination('mèrci')).toBe(true)
    expect(isLikelyHallucination('Voilà')).toBe(true)
  })
})
