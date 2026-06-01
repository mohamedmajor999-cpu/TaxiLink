import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StatusBar, View } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useTheme } from '@/lib/theme';
import { driverService, profileService, reportError } from '@taxilink/services';
import { computeDisplayFare } from '@taxilink/core';
import { useGpsStore } from '@taxilink/stores';
import { DriverHomeTopBar } from '@/components/missions/DriverHomeTopBar';
import { FilterHamburger } from '@/components/missions/FilterHamburger';
import { FiltersSheet } from '@/components/missions/FiltersSheet';
import { MapControlsMinimal } from '@/components/missions/MapControlsMinimal';
import { MissionMapMapbox as MissionMap, type MissionMapHandle, type MissionPin } from '@/components/missions/MissionMapMapbox';
import { MissionAcceptedCelebration } from '@/components/missions/MissionAcceptedCelebration';
import { MissionsCarousel } from '@/components/missions/MissionsCarousel';
import { useAuth } from '@/hooks/useAuth';
import { useDriverHomeFilters } from '@/hooks/useDriverHomeFilters';
import { useDriverMissions } from '@/hooks/useDriverMissions';
import { useTodayEarnings } from '@/hooks/useTodayEarnings';
import { useDriverOnlineStore } from '@/lib/driverOnlineStore';
import { useMapFullscreenStore } from '@/lib/mapFullscreenStore';

const URGENT_THRESHOLD_MIN = 10;

export default function DriverHomeScreen() {
  const { user } = useAuth();
  const userCoords = useGpsStore((s) => s.coords);
  const { missions, acceptMission } = useDriverMissions();
  const { earnings: todayEarnings, count: todayCount } = useTodayEarnings();
  const [accepting, setAccepting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const filters = useDriverHomeFilters({ missions, userCoords });

  const insets = useSafeAreaInsets();
  const mapRef = useRef<MissionMapHandle>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // isOnline vit dans un store global (driverOnlineStore) consomme par le
  // _layout qui monte useDriverOnlineTracking + useDriverHeartbeat. Hisser ces
  // hooks au layout est INDISPENSABLE : avec la BottomNav v3 la home se
  // demonte des qu'on tape sur un onglet → si les hooks vivaient ici, le
  // foregroundService GPS et le heartbeat tombaient toutes les ~30s.
  const isOnline = useDriverOnlineStore((s) => s.isOnline);
  const setIsOnline = useDriverOnlineStore((s) => s.setIsOnline);
  // mapFullscreen vit dans un store global pour que la BottomNav (rendue dans
  // le layout parent) puisse se cacher quand on est en plein-ecran.
  const mapFullscreen = useMapFullscreenStore((s) => s.fullscreen);
  const setMapFullscreen = useMapFullscreenStore((s) => s.setFullscreen);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [profile, setProfile] = useState<{ first_name: string | null; last_name: string | null } | null>(null);

  // Le _layout hydrate isOnline au mount global ; ici on ne fetch que le profil
  // pour les initiales de l'avatar.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    profileService
      .getProfile(user.id)
      .then((p) => {
        if (cancelled || !p) return;
        setProfile({ first_name: p.first_name, last_name: p.last_name });
      })
      .catch((err) => reportError(err, { tags: { phase: 'home-profile-fetch' } }));
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  async function handleToggleOnline() {
    if (!user?.id) return;
    const next = !isOnline;
    setIsOnline(next);
    try {
      await driverService.setOnline(user.id, next);
    } catch (err) {
      reportError(err, { tags: { context: 'setOnline' } });
      setIsOnline(!next);
      Alert.alert('Erreur', 'Impossible de changer ton statut. Réessaie.');
    }
  }

  const { isDark, toggle: toggleTheme } = useTheme();

  const missionPins = useMemo<MissionPin[]>(
    () =>
      filters.filteredMissions
        .map((m) => {
          if (m.departure_lat == null || m.departure_lng == null) return null;
          const minutesUntil = m.scheduled_at
            ? Math.round((new Date(m.scheduled_at).getTime() - Date.now()) / 60000)
            : Infinity;
          const price = computeDisplayFare(m).value;
          return {
            id: m.id,
            lat: m.departure_lat,
            lng: m.departure_lng,
            priceLabel: `${Math.round(price)} €`,
            medical: m.type === 'CPAM',
            urgent: minutesUntil <= URGENT_THRESHOLD_MIN,
            selected: m.id === selectedId,
          };
        })
        .filter((p): p is MissionPin => p !== null),
    [filters.filteredMissions, selectedId],
  );

  // userCoords est passe en props a <MissionMap> directement — plus besoin
  // d'imperative call setUserPosition (l'ancien Mapbox <UserLocation> consommait
  // un feed GPS independant qui faisait clignoter l'icone locate du systeme).

  // Plus de pan auto sur la position GPS au demarrage : la vue initiale doit
  // englober dept 13 + alentours (Marseille / Aix / Saint-Cyr / Martigues /
  // La Ciotat / Cassis) — cf. defaultSettings de la Camera dans MissionMapMapbox.
  // L'utilisateur utilise le bouton "Me localiser" pour recentrer sur sa position.

  useEffect(() => {
    if (!mapReady) return;
    mapRef.current?.setMissions(missionPins);
  }, [mapReady, missionPins]);

  // Quand on selectionne, on vole vers la mission. Quand on deselectionne
  // (selectedId repasse a null APRES avoir ete non-null), on dezoom vers la
  // position user (zoom 11) ou la vue par defaut Bouches-du-Rhone (zoom 9).
  // hadSelectedRef evite de dezoomer au mount initial (ou selectedId est
  // deja null sans avoir ete selectionne avant) — sinon la carte se baladerait
  // toute seule a chaque ouverture.
  const selectedMission = useMemo(
    () => (selectedId ? filters.filteredMissions.find((x) => x.id === selectedId) ?? null : null),
    [filters.filteredMissions, selectedId],
  );
  const hadSelectedRef = useRef(false);
  useEffect(() => {
    if (!mapReady) return;
    if (selectedMission) {
      if (selectedMission.departure_lat == null || selectedMission.departure_lng == null) return;
      hadSelectedRef.current = true;
      mapRef.current?.panTo({
        latitude: selectedMission.departure_lat,
        longitude: selectedMission.departure_lng,
        zoom: 13,
      });
      return;
    }
    if (!hadSelectedRef.current) return;
    hadSelectedRef.current = false;
    if (userCoords) {
      mapRef.current?.panTo({ latitude: userCoords.lat, longitude: userCoords.lng, zoom: 11 });
    } else {
      mapRef.current?.panTo({ latitude: 43.50, longitude: 5.30, zoom: 9 });
    }
  }, [mapReady, selectedMission, userCoords]);

  function handleRecenter() {
    if (!userCoords) return;
    mapRef.current?.panTo({ latitude: userCoords.lat, longitude: userCoords.lng, zoom: 14 });
  }
  function handleProfile() { router.push('/profil'); }
  function handleToggleFullscreen() {
    setMapFullscreen(!mapFullscreen);
    // L'effet ci-dessous (sync orientation) gere lock/unlock — pas de duplication.
  }
  function handleZoomIn() { mapRef.current?.zoomIn(); }
  function handleZoomOut() { mapRef.current?.zoomOut(); }
  // Satellite vs streets : toggle le style de tuile Mapbox. setMapStyle est
  // expose par MissionMap via ref. mapStyle est garde en state pour que le
  // bouton sache son etat actuel et puisse l'inverser.
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
  function handleToggleSatellite() {
    const next: 'streets' | 'satellite' = mapStyle === 'satellite' ? 'streets' : 'satellite';
    setMapStyle(next);
    mapRef.current?.setMapStyle(next);
  }
  // Sync orientation avec mapFullscreen :
  // - fullscreen ON : unlock (user peut pivoter le tel en paysage pour la map)
  // - fullscreen OFF : lock portrait (les autres ecrans/composants sont
  //   designes portrait uniquement, eviter le breakage layout)
  // Cleanup au demontage : toujours re-lock portrait au cas ou le user
  // navigue ailleurs avec fullscreen actif.
  useEffect(() => {
    if (mapFullscreen) {
      ScreenOrientation.unlockAsync().catch(() => {});
    } else {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    }
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, [mapFullscreen]);
  const [is3D, setIs3D] = useState(false);
  function handleToggle3D() {
    if (!is3D) {
      // Avertit avant d'activer (warning conso). Si confirme → bascule.
      Alert.alert(
        'Activer la vue 3D ?',
        'La vue 3D affiche les batiments en relief mais consomme plus de batterie. A utiliser ponctuellement.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Activer',
            onPress: () => {
              setIs3D(true);
              mapRef.current?.set3D(true);
            },
          },
        ],
      );
      return;
    }
    setIs3D(false);
    mapRef.current?.set3D(false);
  }

  async function handleAcceptMission(id: string) {
    setSelectedId(id);
    setShowCelebration(true);
    try {
      setAccepting(true);
      await acceptMission(id);
      setSelectedId(null);
    } catch (err) {
      setShowCelebration(false);
      reportError(err, { tags: { phase: 'mission-accept' } });
      Alert.alert(
        'Impossible d’accepter',
        err instanceof Error ? err.message : 'Erreur inconnue. Réessaie.',
      );
    } finally {
      setAccepting(false);
    }
  }

  function handleShowDetail(id: string) { router.push(`/mission/${id}`); }

  // Plein ecran : cache status bar + nav bar Android.
  //
  // Crash report 2026-05-24 : tap sur la croix (exit plein ecran) faisait
  // fermer l'app. Cause probable : `NavigationBar.setBehaviorAsync('overlay-
  // swipe')` est deprecie sur Android 15 (edge-to-edge force par defaut) et
  // throw au lieu de no-op sur certains OEM. On le supprime — la barre
  // re-apparait quand setVisibilityAsync('visible') sans gesture override.
  //
  // Tous les appels natifs sont desormais wrappes en try/catch defensifs,
  // chaque ratage n'est plus fatal.
  useEffect(() => {
    try {
      StatusBar.setHidden(mapFullscreen, 'slide');
    } catch {
      // ignore
    }
    NavigationBar.setVisibilityAsync(mapFullscreen ? 'hidden' : 'visible').catch(() => {});
    return () => {
      try {
        StatusBar.setHidden(false);
      } catch {
        // ignore
      }
      NavigationBar.setVisibilityAsync('visible').catch(() => {});
    };
  }, [mapFullscreen]);

  // Reset le flag plein-ecran au demontage pour ne pas laisser la BottomNav
  // cachee si l'utilisateur navigue ailleurs depuis le plein-ecran (rare mais
  // techniquement possible avec un deep link).
  useEffect(() => {
    return () => setMapFullscreen(false);
  }, [setMapFullscreen]);

  // Toggle de selection : reclique sur le meme pin/carte deselectionne, ce qui
  // permet a l'effet de dezoom (voir hadSelectedRef) de se declencher. Demande
  // user 2026-05-24 : "je peux deselectionner en recliquant dessus ce qui creer
  // un dezoom sur la carte".
  function handleSelectMission(id: string | null) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  const initials = extractInitials(profile?.first_name, profile?.last_name);
  const showChrome = !mapFullscreen;
  // Offset bas pour MapControlsMinimal : au-dessus du carousel + BottomNav en
  // mode normal, juste au-dessus du bord en plein-ecran.
  const controlsBottom = mapFullscreen ? insets.bottom + 24 : insets.bottom + 64 + 245;
  const activeFiltersCount =
    (filters.filter !== 'ALL' ? 1 : 0)
    + (filters.urgentOnly ? 1 : 0)
    + (filters.nearbyOnly ? 1 : 0)
    + (filters.dateFilter !== 'all' ? 1 : 0);

  return (
    <View className="flex-1">
      <MissionMap
        ref={mapRef}
        userCoords={userCoords}
        onReady={() => setMapReady(true)}
        onSelectMission={handleSelectMission}
      />

      {showChrome && (
        <DriverHomeTopBar
          isOnline={isOnline}
          count={filters.counts.ALL}
          initials={initials}
          nightActive={isDark}
          onToggleOnline={handleToggleOnline}
          onToggleNight={toggleTheme}
          onProfile={handleProfile}
          todayEarnings={todayEarnings}
          todayCount={todayCount}
          onEarnings={() => router.push('/profil/stats')}
        />
      )}

      {showChrome && (
        <FilterHamburger
          // key={isDark}: force remount au bascule theme. Sous Fabric (New Arch)
          // + expo-router Stack, les enfants de screen consommant useTheme()
          // SANS recevoir aussi une prop derivee du theme ne re-rendent pas
          // toujours au Context update — icones/textes restent peints avec la
          // couleur ink de l'ancien theme (invisible : blanc sur blanc en
          // light apres dark→light). Remount = recall useTheme frais → OK.
          key={isDark ? 'd' : 'l'}
          top={insets.top + 64}
          activeCount={activeFiltersCount}
          onPress={() => setFiltersOpen(true)}
        />
      )}

      <MapControlsMinimal
        key={isDark ? 'd' : 'l'}
        rightBottom={controlsBottom}
        onLocate={handleRecenter}
        onFullscreen={handleToggleFullscreen}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onToggle3D={handleToggle3D}
        onToggleSatellite={handleToggleSatellite}
        fullscreenActive={mapFullscreen}
        is3D={is3D}
        isSatellite={mapStyle === 'satellite'}
      />

      <FiltersSheet
        visible={filtersOpen}
        filter={filters.filter}
        counts={filters.counts}
        urgentOnly={filters.urgentOnly}
        nearbyOnly={filters.nearbyOnly}
        hasUserCoords={!!userCoords}
        dateFilter={filters.dateFilter}
        onFilterChange={filters.setFilter}
        onUrgentToggle={() => filters.setUrgentOnly(!filters.urgentOnly)}
        onNearbyToggle={() => filters.setNearbyOnly(!filters.nearbyOnly)}
        onDateFilterChange={filters.setDateFilter}
        onClose={() => setFiltersOpen(false)}
      />

      {showChrome && (
        <MissionsCarousel
          missions={filters.filteredMissions}
          totalCount={filters.counts.ALL}
          selectedId={selectedId}
          userCoords={userCoords}
          accepting={accepting}
          onSelect={handleSelectMission}
          onAccept={handleAcceptMission}
          onShowDetail={handleShowDetail}
        />
      )}

      {showCelebration && (
        <MissionAcceptedCelebration onDone={() => setShowCelebration(false)} />
      )}
    </View>
  );
}

function extractInitials(firstName?: string | null, lastName?: string | null): string {
  if (firstName && lastName) return ((firstName[0] ?? '') + (lastName[0] ?? '')).toUpperCase();
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  return '··';
}
