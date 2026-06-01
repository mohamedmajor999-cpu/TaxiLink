import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { authService, driverService, groupService, profileService, reportError } from '@taxilink/services';

import { useAuth } from '@/hooks/useAuth';
import type { DrawerTab } from '@/components/navigation/SideBarDrawer';

interface Options {
  /** Onglet actif pour le surligner dans le drawer */
  activeTab: DrawerTab;
  /** Callback custom pour le bouton "Poster une course" (par défaut : navigate /poster-course) */
  onPostCourse?: () => void;
}

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  activeTab: DrawerTab;
  onTabChange: (tab: DrawerTab) => void;
  onPostCourse: () => void;
  onSignOut: () => void;
  name: string;
  initials: string;
  groupName: string | null;
  isOnline: boolean;
  coursesBadge: number;
}

function extractInitials(firstName?: string | null, lastName?: string | null): string {
  if (firstName && lastName) return ((firstName[0] ?? '') + (lastName[0] ?? '')).toUpperCase();
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  return '··';
}

/**
 * Logique partagée du SideBarDrawer pour tous les écrans driver :
 * fetch profil + groupe primaire + statut online, handlers navigation,
 * sign-out avec flip offline. Retourne `drawerProps` prêt à spread
 * sur `<SideBarDrawer {...drawerProps}/>` + `openDrawer()` pour le hamburger.
 */
export function useDriverDrawer({ activeTab, onPostCourse }: Options) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
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
    setOpen(false);
    if (tab === 'carte') { router.push('/'); return; }
    if (tab === 'courses') { router.push('/courses'); return; }
    if (tab === 'groupes') { router.push('/groupes'); return; }
    if (tab === 'profil') { router.push('/profil'); return; }
  }

  function handlePostCourse() {
    setOpen(false);
    if (onPostCourse) { onPostCourse(); return; }
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
              reportError(err, { tags: { context: 'signOut.flipOffline' } });
            });
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

  const drawerProps: DrawerProps = {
    open,
    onClose: () => setOpen(false),
    activeTab,
    onTabChange: handleTabChange,
    onPostCourse: handlePostCourse,
    onSignOut: handleSignOut,
    name: profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile?.first_name ?? 'Chauffeur',
    initials: extractInitials(profile?.first_name, profile?.last_name),
    groupName: primaryGroup,
    isOnline,
    coursesBadge: 0,
  };

  return {
    drawerProps,
    openDrawer: () => setOpen(true),
  };
}
