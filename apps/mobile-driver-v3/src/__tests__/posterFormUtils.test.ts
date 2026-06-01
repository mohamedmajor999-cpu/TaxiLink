import { describe, expect, it } from 'vitest';
import {
  buildScheduledAt,
  parsePrice,
  defaultDate,
  defaultTime,
} from '../components/courses/poster/posterFormUtils';

// Tests pour les helpers purs du formulaire de publication (audit L-22).

describe('buildScheduledAt', () => {
  it('combine date + heure valides en ISO (fuseau local → UTC)', () => {
    const iso = buildScheduledAt('2026-06-01', '14:30');
    expect(iso).not.toBeNull();
    // Reconstruit le même instant local pour comparer sans dépendre du TZ du CI.
    const expected = new Date(2026, 5, 1, 14, 30, 0, 0).toISOString();
    expect(iso).toBe(expected);
  });

  it('accepte une heure à un chiffre (H:MM)', () => {
    expect(buildScheduledAt('2026-06-01', '9:05')).toBe(new Date(2026, 5, 1, 9, 5, 0, 0).toISOString());
  });

  it('rejette un format de date invalide', () => {
    expect(buildScheduledAt('01/06/2026', '14:30')).toBeNull();
    expect(buildScheduledAt('2026-6-1', '14:30')).toBeNull();
    expect(buildScheduledAt('', '14:30')).toBeNull();
  });

  it('rejette un format d\'heure invalide', () => {
    expect(buildScheduledAt('2026-06-01', '14h30')).toBeNull();
    expect(buildScheduledAt('2026-06-01', '')).toBeNull();
  });

  it('tolère les espaces autour', () => {
    expect(buildScheduledAt('  2026-06-01 ', ' 14:30 ')).toBe(new Date(2026, 5, 1, 14, 30, 0, 0).toISOString());
  });
});

describe('parsePrice', () => {
  it('parse un nombre avec virgule ou point', () => {
    expect(parsePrice('12,50')).toBe(12.5);
    expect(parsePrice('12.50')).toBe(12.5);
    expect(parsePrice('30')).toBe(30);
  });

  it('accepte 0', () => {
    expect(parsePrice('0')).toBe(0);
  });

  it('retourne null sur vide ou non-numérique', () => {
    expect(parsePrice('')).toBeNull();
    expect(parsePrice('   ')).toBeNull();
    expect(parsePrice('abc')).toBeNull();
  });

  it('rejette les valeurs négatives', () => {
    expect(parsePrice('-5')).toBeNull();
  });
});

describe('defaultDate', () => {
  it('retourne le jour courant au format YYYY-MM-DD', () => {
    expect(defaultDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('defaultTime', () => {
  it('retourne une heure HH:MM arrondie au quart d\'heure', () => {
    const t = defaultTime();
    expect(t).toMatch(/^\d{2}:\d{2}$/);
    const minutes = Number(t.slice(3));
    expect([0, 15, 30, 45]).toContain(minutes);
  });
});
