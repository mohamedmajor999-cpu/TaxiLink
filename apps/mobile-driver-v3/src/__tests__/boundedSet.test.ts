import { describe, expect, it } from 'vitest';
import { rememberBounded, DEFAULT_DEDUP_CAP } from '../lib/boundedSet';

// Tests pour `rememberBounded` — le tracker anti-doublon borné (audit I-22).
// Doit se comporter comme `set.add(id)` tant qu'on est sous le plafond, puis
// évincer les plus anciens (ordre d'insertion) au-delà, sans jamais dépasser.

describe('rememberBounded', () => {
  it('ajoute un id comme set.add tant qu\'on est sous le plafond', () => {
    const s = new Set<string>();
    rememberBounded(s, 'a', 3);
    rememberBounded(s, 'b', 3);
    expect(s.has('a')).toBe(true);
    expect(s.has('b')).toBe(true);
    expect(s.size).toBe(2);
  });

  it('ne grossit pas sur un id déjà présent (dédup)', () => {
    const s = new Set<string>();
    rememberBounded(s, 'a', 3);
    rememberBounded(s, 'a', 3);
    expect(s.size).toBe(1);
  });

  it('borne la taille au plafond en évinçant les plus anciens', () => {
    const s = new Set<string>();
    rememberBounded(s, 'a', 2);
    rememberBounded(s, 'b', 2);
    rememberBounded(s, 'c', 2); // évince 'a' (le plus ancien)
    expect(s.size).toBe(2);
    expect(s.has('a')).toBe(false);
    expect(s.has('b')).toBe(true);
    expect(s.has('c')).toBe(true);
  });

  it('reste borné sur une longue série (simulation shift)', () => {
    const s = new Set<string>();
    for (let i = 0; i < 5000; i++) rememberBounded(s, `id-${i}`, 100);
    expect(s.size).toBe(100);
    // Les 100 derniers sont retenus, les anciens évincés.
    expect(s.has('id-4999')).toBe(true);
    expect(s.has('id-0')).toBe(false);
  });

  it('utilise DEFAULT_DEDUP_CAP par défaut', () => {
    const s = new Set<string>();
    for (let i = 0; i < DEFAULT_DEDUP_CAP + 50; i++) rememberBounded(s, `id-${i}`);
    expect(s.size).toBe(DEFAULT_DEDUP_CAP);
  });
});
