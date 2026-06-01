import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { authService, driverService, groupService, profileService, reportError } from '@taxilink/services';

import type { DrawerTab } from '@/components/navigation/SideBarDrawer';
import { useAuth } from '@/hooks/useAuth';

// Hook partagé : agrège profil + groupe primaire + statut online + handlers
// pour tous les écrans qui montent un SideBarDrawer (hamburger fonctionnel).
export function useDrawerData() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ first_name: string | null; last_name: string | null } | null>(null);
  const [primaryGroup, setPrimaryGroup] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    Promise.all([
      profileService.getProfile(user.id).catch(() => null),
      groupService.getMyGroups(user.id).catch(() => []),
      driverService.getDriver(user.id).catch(() => null),
    ]).then(([p, groups, driver]) => {
      if (cancelled) return;
      if (p) setProfile({ first_name: p.first_name, last_name: p.last_name });
      setPrimaryGroup(groups[0]?.name ?? null);
      setIsOnline(driver?.is_online ?? false);
    }).catch((err) => reportError(err, { tags: { phase: 'drawer-data-fetch' } }));
    return () => { cancelled = true; };
  }, [user?.id]);

  function handleTabChange(tab: DrawerTab) {
    if (tab === 'carte') { router.push('/'); return; }
    if (tab === 'courses') { router.push('/courses'); return; }
    if (tab === 'groupes') { router.push('/groupes'); return; }
    if (tab === 'profil') { router.push('/profil'); return; }
  }

  function handleSignOut() {
    Alert.alert('Se déconnecter', 'Veux-tu vraiment te déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          if (user?.id) {
            await driverService.setOnline(user.id, false).catch((err) =>
              reportError(err, { tags: { context: 'signOut.flipOffline' } }),
            );
          }
          try {
            await authService.signOut();
          } catch (err) {
            reportError(err, { tags: { phase: 'sign-out' } });
            Alert.alert('Erreur', 'Impossible de se déconnecter.');
          }
        },
      },
    ]);
  }

  function handlePostCourse() {
    router.push('/poster-course');
  }

  const firstName = profile?.first_name ?? '';
  const lastName = profile?.last_name ?? '';
  const name = (firstName + ' ' + lastName).trim() || 'Chauffeur';
  const initials = ((firstName[0] ?? '') + (lastName[0] ?? '')).toUpperCase() || '··';

  return {
    name,
    initials,
    primaryGroup,
    isOnline,
    handleTabChange,
    handleSignOut,
    handlePostCourse,
  };
}
