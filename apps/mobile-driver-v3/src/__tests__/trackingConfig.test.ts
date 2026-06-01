import { describe, expect, it } from 'vitest';
import { profileFor, profilesEqual, notificationBodyFor, type TrackingProfile } from '../lib/trackingConfig';

// Tests pour `profileFor` — la fonction qui decide du profil GPS en fonction
// de courseState + batterie (motion + AppState ignores depuis refonte 2026-05-25).
//
// Specification cible :
//   - 10s tick UNIQUE peu importe l'etat (idle, assigned, in_progress,
//     stationary, moving, foreground, background). Precision 'high' (~10m).
//   - Garde-fou batterie : <20% hors course active → 30s + 'balanced'.

describe('profileFor — cadence unique 10s + precision high (~10m)', () => {
  it('idle + moving foreground → 10s high', () => {
    const p = profileFor({ courseState: 'idle', batteryLevel: 0.8, isMoving: true, appBackgrounded: false });
    expect(p.intervalMs).toBe(10_000);
    expect(p.accuracy).toBe('high');
    expect(p.distanceM).toBe(0);
    expect(p.deferredMs).toBe(0);
  });

  it('idle + stationary foreground → toujours 10s high', () => {
    const p = profileFor({ courseState: 'idle', batteryLevel: 0.8, isMoving: false, appBackgrounded: false });
    expect(p.intervalMs).toBe(10_000);
    expect(p.accuracy).toBe('high');
  });

  it('idle + background → toujours 10s high', () => {
    const p = profileFor({ courseState: 'idle', batteryLevel: 0.8, isMoving: true, appBackgrounded: true });
    expect(p.intervalMs).toBe(10_000);
    expect(p.accuracy).toBe('high');
  });

  it('assigned + moving → 10s high', () => {
    const p = profileFor({ courseState: 'assigned', batteryLevel: 0.8, isMoving: true, appBackgrounded: false });
    expect(p.intervalMs).toBe(10_000);
    expect(p.accuracy).toBe('high');
  });

  it('assigned + stationary → toujours 10s high', () => {
    const p = profileFor({ courseState: 'assigned', batteryLevel: 0.8, isMoving: false, appBackgrounded: false });
    expect(p.intervalMs).toBe(10_000);
    expect(p.accuracy).toBe('high');
  });

  it('in_progress → 10s high', () => {
    const p = profileFor({ courseState: 'in_progress', batteryLevel: 0.8, isMoving: true, appBackgrounded: false });
    expect(p.intervalMs).toBe(10_000);
    expect(p.accuracy).toBe('high');
  });
});

describe('profileFor — garde-fou batterie critique (<20%)', () => {
  it('idle + batterie 15% → 30s balanced (eco autonomie)', () => {
    const p = profileFor({ courseState: 'idle', batteryLevel: 0.15, isMoving: true, appBackgrounded: false });
    expect(p.intervalMs).toBe(30_000);
    expect(p.accuracy).toBe('balanced');
    expect(p.deferredMs).toBe(60_000);
  });

  it("en course active <20% : RESTE a 10s high (chauffeur branche, admin doit voir)", () => {
    const assigned = profileFor({ courseState: 'assigned', batteryLevel: 0.10, isMoving: true, appBackgrounded: false });
    expect(assigned.intervalMs).toBe(10_000);
    expect(assigned.accuracy).toBe('high');
    const inProgress = profileFor({ courseState: 'in_progress', batteryLevel: 0.10, isMoving: true, appBackgrounded: false });
    expect(inProgress.intervalMs).toBe(10_000);
    expect(inProgress.accuracy).toBe('high');
  });

  it('seuil 20% inclus dans le mode nominal (>= 0.2 → 10s)', () => {
    const p = profileFor({ courseState: 'idle', batteryLevel: 0.20, isMoving: true, appBackgrounded: false });
    expect(p.intervalMs).toBe(10_000);
  });

  it('batteryLevel = -1 (inconnu) → 10s nominal (pas le garde-fou)', () => {
    const p = profileFor({ courseState: 'idle', batteryLevel: -1, isMoving: true, appBackgrounded: false });
    expect(p.intervalMs).toBe(10_000);
  });
});

describe('profilesEqual', () => {
  const p1: TrackingProfile = { intervalMs: 10_000, distanceM: 0, accuracy: 'high', deferredMs: 0, deferredM: 0 };
  const p2: TrackingProfile = { intervalMs: 10_000, distanceM: 0, accuracy: 'high', deferredMs: 0, deferredM: 0 };
  const p3: TrackingProfile = { intervalMs: 10_000, distanceM: 0, accuracy: 'balanced', deferredMs: 0, deferredM: 0 };

  it('renvoie true pour deux profils identiques', () => {
    expect(profilesEqual(p1, p2)).toBe(true);
  });

  it('renvoie false sur difference d accuracy', () => {
    expect(profilesEqual(p1, p3)).toBe(false);
  });

  it('renvoie true pour deux nulls (cas reset au offline)', () => {
    expect(profilesEqual(null, null)).toBe(true);
  });

  it('renvoie false pour null vs profile', () => {
    expect(profilesEqual(null, p1)).toBe(false);
    expect(profilesEqual(p1, null)).toBe(false);
  });
});

describe('notificationBodyFor — texte de la notif foreground service', () => {
  it('batterie critique prime sur tout le reste', () => {
    expect(notificationBodyFor('in_progress', 0.15, true)).toBe('Position partagée (mode économie batterie).');
    expect(notificationBodyFor('assigned', 0.1, false)).toBe('Position partagée (mode économie batterie).');
  });

  it('course assignée → en route', () => {
    expect(notificationBodyFor('assigned', 0.8, true)).toBe('En route vers votre client.');
  });

  it('course en cours → course en cours', () => {
    expect(notificationBodyFor('in_progress', 0.8, false)).toBe('Course en cours.');
  });

  it('idle à l\'arrêt → mention mode éco', () => {
    expect(notificationBodyFor('idle', 0.8, false)).toBe('Position partagée (à l\'arrêt, mode éco).');
  });

  it('idle en mouvement (ou capteur indispo) → texte par défaut', () => {
    expect(notificationBodyFor('idle', 0.8, true)).toBe('Votre position est partagée pour recevoir des courses.');
    expect(notificationBodyFor('idle', 0.8, null)).toBe('Votre position est partagée pour recevoir des courses.');
  });

  it('batterie inconnue (-1) ne déclenche pas le mode éco', () => {
    expect(notificationBodyFor('idle', -1, true)).toBe('Votre position est partagée pour recevoir des courses.');
  });
});
