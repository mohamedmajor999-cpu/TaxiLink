import { describe, expect, it } from 'vitest';
import type { Mission } from '@taxilink/supabase-types';
import {
  canSeeFullMission,
  formatDuration,
  maskName,
} from '../components/mission-detail/missionDetailHelpers';

// Tests des helpers RGPD Article 9. Une regression ici exposerait du nom
// patient + telephone + notes a un chauffeur non autorise. Donc tests
// exhaustifs sur la matrice {status, role-relation}.

function mockMission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: 'm1',
    status: 'AVAILABLE',
    type: 'CPAM',
    departure: 'A',
    destination: 'B',
    shared_by: 'sharer-1',
    driver_id: null,
    client_id: null,
    patient_name: 'Jean Dupont',
    phone: '0600000000',
    notes: 'allergies penicilline',
    scheduled_at: new Date().toISOString(),
    ...overrides,
  } as Mission;
}

describe('canSeeFullMission — RGPD Art. 9', () => {
  it('refuse si viewerId est null (non authentifie)', () => {
    expect(canSeeFullMission(mockMission(), null)).toBe(false);
  });

  it('refuse tant que la mission est AVAILABLE meme si on est shared_by', () => {
    const m = mockMission({ status: 'AVAILABLE', shared_by: 'me' });
    expect(canSeeFullMission(m, 'me')).toBe(false);
  });

  it('autorise shared_by une fois la course attribuee', () => {
    const m = mockMission({ status: 'TAKEN', shared_by: 'me', driver_id: 'other' });
    expect(canSeeFullMission(m, 'me')).toBe(true);
  });

  it('autorise le driver qui a accepte', () => {
    const m = mockMission({ status: 'TAKEN', driver_id: 'me' });
    expect(canSeeFullMission(m, 'me')).toBe(true);
  });

  it('autorise le client de la course', () => {
    const m = mockMission({ status: 'TAKEN', client_id: 'me' });
    expect(canSeeFullMission(m, 'me')).toBe(true);
  });

  it('refuse un viewer non implique meme apres attribution', () => {
    const m = mockMission({ status: 'TAKEN', shared_by: 'a', driver_id: 'b', client_id: 'c' });
    expect(canSeeFullMission(m, 'me')).toBe(false);
  });

  it("refuse un viewer non implique sur une course IN_PROGRESS (attaque par URL directe)", () => {
    const m = mockMission({ status: 'IN_PROGRESS', shared_by: 'a', driver_id: 'b' });
    expect(canSeeFullMission(m, 'me')).toBe(false);
  });

  it("autorise le shared_by sur DONE (historique perso)", () => {
    const m = mockMission({ status: 'DONE', shared_by: 'me' });
    expect(canSeeFullMission(m, 'me')).toBe(true);
  });
});

describe('maskName', () => {
  it('renvoie null pour input null', () => {
    expect(maskName(null)).toBe(null);
  });

  it('renvoie null pour chaine vide ou whitespace', () => {
    expect(maskName('')).toBe(null);
    expect(maskName('   ')).toBe(null);
  });

  it('masque un nom simple en initiales', () => {
    expect(maskName('Jean Dupont')).toBe('J. D.');
  });

  it('masque les noms composes (3+ parties)', () => {
    expect(maskName('Marie-Claire Van Der Berg')).toBe('M. V. D. B.');
  });

  it('uppercase les initiales meme si input lowercase', () => {
    expect(maskName('jean dupont')).toBe('J. D.');
  });

  it('gere les espaces multiples', () => {
    expect(maskName('Jean   Dupont')).toBe('J. D.');
  });

  it('gere un seul mot', () => {
    expect(maskName('Madonna')).toBe('M.');
  });
});

describe('formatDuration', () => {
  it('< 1h : affiche en minutes', () => {
    expect(formatDuration(5)).toBe('5 min');
    expect(formatDuration(45)).toBe('45 min');
  });

  it('heures pleines : pas de minutes', () => {
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(120)).toBe('2h');
  });

  it('heures + minutes', () => {
    expect(formatDuration(90)).toBe('1h 30');
    expect(formatDuration(125)).toBe('2h 5');
  });

  it('jours pleins', () => {
    expect(formatDuration(24 * 60)).toBe('1j');
    expect(formatDuration(48 * 60)).toBe('2j');
  });

  it('jours + heures', () => {
    expect(formatDuration(25 * 60)).toBe('1j 1h');
    expect(formatDuration(36 * 60)).toBe('1j 12h');
  });

  it('0 minute', () => {
    expect(formatDuration(0)).toBe('0 min');
  });
});
