import { beforeEach, describe, expect, it } from 'vitest';
import { useDriverOnlineStore } from '../lib/driverOnlineStore';

// Tests du store global qui partage l'etat "en ligne" + courseState entre la
// home (toggle UI) et le _layout (hooks de tracking). Une regression ici
// signifie qu'un set sur un screen n'est plus vu par les hooks → tracking GPS
// figé sur le mauvais profil. Critical pour le bug "online cassé par BottomNav".

describe('driverOnlineStore', () => {
  beforeEach(() => {
    // Reset entre chaque test (le store est un singleton global).
    useDriverOnlineStore.setState({ isOnline: false, courseState: 'idle' });
  });

  it('etat initial : offline + idle', () => {
    const s = useDriverOnlineStore.getState();
    expect(s.isOnline).toBe(false);
    expect(s.courseState).toBe('idle');
  });

  it('setIsOnline met a jour le flag', () => {
    useDriverOnlineStore.getState().setIsOnline(true);
    expect(useDriverOnlineStore.getState().isOnline).toBe(true);
    useDriverOnlineStore.getState().setIsOnline(false);
    expect(useDriverOnlineStore.getState().isOnline).toBe(false);
  });

  it("setCourseState met a jour l'etat de course", () => {
    useDriverOnlineStore.getState().setCourseState('assigned');
    expect(useDriverOnlineStore.getState().courseState).toBe('assigned');
    useDriverOnlineStore.getState().setCourseState('in_progress');
    expect(useDriverOnlineStore.getState().courseState).toBe('in_progress');
    useDriverOnlineStore.getState().setCourseState('idle');
    expect(useDriverOnlineStore.getState().courseState).toBe('idle');
  });

  it('isOnline et courseState sont independants', () => {
    useDriverOnlineStore.getState().setIsOnline(true);
    useDriverOnlineStore.getState().setCourseState('in_progress');
    const s = useDriverOnlineStore.getState();
    expect(s.isOnline).toBe(true);
    expect(s.courseState).toBe('in_progress');

    useDriverOnlineStore.getState().setIsOnline(false);
    expect(useDriverOnlineStore.getState().courseState).toBe('in_progress'); // garde l'etat
  });
});
