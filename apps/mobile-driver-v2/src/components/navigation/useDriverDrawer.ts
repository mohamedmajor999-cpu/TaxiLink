import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { authService, driverService, groupService, profileService, reportError } from '@taxilink/services';

import { useAuth } from '@/hooks/useAuth';
import type { DrawerTab } from './SideBarDrawer';

interface ProfileLite {
  first_name: string | null;
  last_name: string | null;
}

function extractInitials(firstName?: string | null, lastName?: string | null): string {
  if (firstName && lastName) return ((firstName[0] ?? '') + (lastName[0] ?? '')).toUpperCase();
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  return '··';
}

// Hook centralise pour piloter le SideBarDrawer depuis n'importe quel ecran
// du flow chauffeur (carte, courses, profil, groupes). Charge profile + groupe
// primaire + statut online a chaque montage et expose toute la machinerie
// d'ouverture/fermeture + navigation entre tabs.
export function useDriverDrawer(activeTab: DrawerTab) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileLite | null>(null);
  const [primaryGroup, setPrimaryGroup] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    Promise.all([
      profileService.getProfile(user.id).catch(() => null),
      groupService.getMyGroups(user.id).catch(() => []),
      driverService.getDriver(user.id).catch(() => null),
    ])
      .then(([p, groups, driver]) => {
        if (cancelled) return;
        if (p) setProfile({ first_name: p.first_name, last_name: p.last_name });
        setPrimaryGroup(groups[0]?.name ?? null);
        setIsOnline(driver?.is_online ?? false);
      })
      .catch((err) => reportError(err, { tags: { phase: 'drawer-data-fetch' } }));
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  function handleTabChange(tab: DrawerTab) {
    setOpen(false);
    if (tab === activeTab) return;
    if (tab === 'carte') router.push('/');
    else if (tab === 'courses') router.push('/courses');
    else if (tab === 'groupes') router.push('/groupes');
    else if (tab === 'profil') router.push('/profil');
  }

  function handlePostCourse() {
    setOpen(false);
    router.push('/poster-course');
  }

  function handleSignOut() {
    Alert.alert('Se déconnecter', 'Veux-tu vraiment te déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          setOpen(false);
          if (user?.id) {
            await driverService.setOnline(user.id, false).catch((err) => {
              reportError(err, { tags: { context: 'drawer.signOut.flipOffline' } });
            });
          }
          try {
            await authService.signOut();
          } catch (err) {
            reportError(err, { tags: { phase: 'drawer.sign-out' } });
            Alert.alert('Erreur', 'Impossible de se déconnecter.');
          }
        },
      },
    ]);
  }

  const name =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile?.first_name ?? 'Chauffeur';
  const initials = extractInitials(profile?.first_name, profile?.last_name);

  return {
    open,
    setOpen,
    name,
    initials,
    primaryGroup,
    isOnline,
    handleTabChange,
    handlePostCourse,
    handleSignOut,
  };
}
