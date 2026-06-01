import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StatusBar, View } from 'react-native';
import type BottomSheet from '@gorhom/bottom-sheet';
import * as NavigationBar from 'expo-navigation-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme';

import { router } from 'expo-router';
import { authService, driverService, groupService, profileService, reportError } from '@taxilink/services';
import { computeDisplayFare } from '@taxilink/core';
import { useGpsStore } from '@taxilink/stores';
import { DriverHomeTopBar } from '@/components/missions/DriverHomeTopBar';
import { DriverHomeFilterChips } from '@/components/missions/DriverHomeFilterChips';
import { InfoButton } from '@/components/missions/InfoButton';
import { MapControls } from '@/components/missions/MapControls';
import { MissionMap, type MapStyle, type MissionMapHandle, type MissionPin } from '@/components/missions/MissionMap';
import { MissionMapPopup } from '@/components/missions/MissionMapPopup';
import { MissionAcceptedCelebration } from '@/components/missions/MissionAcceptedCelebration';
import { DriverHomeAcceptBar } from '@/components/missions/DriverHomeAcceptBar';
import { COLLAPSED_SHEET_HEIGHT, MissionsSheet } from '@/components/missions/MissionsSheet';
import { PostCourseFab } from '@/components/missions/PostCourseFab';
import { SideBarDrawer, type DrawerTab } from '@/components/navigation/SideBarDrawer';
import { useAuth } from '@/hooks/useAuth';
import { useDriverHomeFilters } from '@/hooks/useDriverHomeFilters';
import { useDriverMissions } from '@/hooks/useDriverMissions';
import { useDriverHeartbeat } from '@/hooks/useDriverHeartbeat';
import { useDriverOnlineTracking } from '@/hooks/useDriverOnlineTracking';
import { useGeolocPref } from '@/hooks/useGeolocPref';

const URGENT_THRESHOLD_MIN = 10;

export default function DriverHomeScreen() {
  const { user } = useAuth();
  const { enabled: geolocEnabled } = useGeolocPref();
  // GPS lu depuis le store global (alimente par useDriverGpsTracking monte
  // dans (driver)/_layout.tsx). Une seule souscription pour toute la session :
  // pas de re-fix GPS quand on revient sur cet ecran depuis un sous-screen.
  const userCoords = useGpsStore((s) => s.coords);
  const { missions, acceptMission } = useDriverMissions();
  const [accepting, setAccepting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const filters = useDriverHomeFilters({ missions, userCoords });

  // Inset système bas : nav bar Android en mode edge-to-edge. Utilisé pour
  // décaler le placeholder du sheet, sinon il passe sous la barre de gestes.
  const insets = useSafeAreaInsets();

  const mapRef = useRef<MissionMapHandle>(null);
  const sheetRef = useRef<BottomSheet>(null);
  const [mapReady, setMapReady] = useState(false);
  // Placeholder visible uniquement pendant le cold start gorhom (~1s en Expo
  // Go). Après, on le masque sinon il apparaît en double avec le vrai sheet
  // pendant les toggles thème (lui bouge avec insets, le vrai sheet rattrape
  // ~400ms après via cascade snapToIndex).
  const [showSheetPlaceholder, setShowSheetPlaceholder] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowSheetPlaceholder(false), 1500);
    return () => clearTimeout(t);
  }, []);
  // Sélection avec sa source : 'map' = clic sur pin (→ popup s'affiche,
  // sheet reste tel quel), 'sheet' = clic sur item dans liste (→ sheet
  // s'auto-déploie et affiche barre Accepter/Détail en footer).
  const [selection, setSelection] = useState<{ id: string; source: 'map' | 'sheet' } | null>(null);
  const selectedMissionId = selection?.id ?? null;
  const selectionSource = selection?.source ?? null;
  const [sheetIndex, setSheetIndex] = useState(0);
  const [isOnline, setIsOnline] = useState(false);
  // Tracking GPS background adaptatif (cf. trackingConfig.profileFor) :
  //   - idle online   : 15s / 10m   (cas par défaut, ce screen)
  //   - assigned      : 3s  / 5m    (à câbler quand flow "course acceptée" existera)
  //   - in_progress   : 5s  / 10m   (idem)
  //   - batterie <20% : 30s / 20m   (auto)
  // Continue de pinger Supabase (current_lat/lng/updated_at + last_seen_at)
  // même app fermée, jusqu'au toggle offline ou logout.
  useDriverOnlineTracking({
    isOnline,
    userId: user?.id ?? null,
    geolocEnabled,
    courseState: 'idle',
  });
  // Heartbeat foreground 30s decouple du GPS : garantit que `last_seen_at`
  // reste frais cote admin meme si la task background tarde (doze mode,
  // battery optimization OEM). Cf. useDriverHeartbeat.
  useDriverHeartbeat({ isOnline, userId: user?.id ?? null });
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyle>('streets');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DrawerTab>('carte');
  const [profile, setProfile] = useState<{ first_name: string | null; last_name: string | null } | null>(null);
  const [primaryGroup, setPrimaryGroup] = useState<string | null>(null);

  // Fetch profil + groupe primaire + statut online initial au montage user
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
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Toggle En ligne / Hors ligne — optimistic UI + écriture DB awaited (PWA: driverStore.setOnline).
  // Rollback local en cas d'erreur pour rester cohérent avec la DB.
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

  // Mode nuit : pilote par ThemeProvider root (useTheme + nightModeStore
  // persistant). Le toggle sun/moon flip light/dark et propage a toute l'app
  // (carte Mapbox dark, drawer, profil...) ainsi qu'a Appearance systeme RN.
  const { isDark, toggle: toggleTheme, colors: themeColors } = useTheme();

  const missionPins = useMemo<MissionPin[]>(
    () =>
      filters.filteredMissions
        .map((m) => {
          if (m.departure_lat == null || m.departure_lng == null) return null;
          const minutesUntil = m.scheduled_at
            ? Math.round((new Date(m.scheduled_at).getTime() - Date.now()) / 60000)
            : Infinity;
          // Tarif affiché : price_eur si saisi, sinon estimation CPAM/Marseille
          const price = computeDisplayFare(m as never).value;
          return {
            id: m.id,
            lat: m.departure_lat,
            lng: m.departure_lng,
            priceLabel: `${Math.round(price)} €`,
            medical: m.type === 'CPAM',
            urgent: minutesUntil <= URGENT_THRESHOLD_MIN,
            selected: m.id === selectedMissionId,
          };
        })
        .filter((p): p is MissionPin => p !== null),
    [filters.filteredMissions, selectedMissionId],
  );

  // Update du pin user a chaque tick GPS. Une coord existe deja au mount
  // dans 99% des cas (store hydrate depuis AsyncStorage en quelques ms apres
  // le 1er lancement ; ensuite useDriverGpsTracking l'actualise).
  useEffect(() => {
    if (!mapReady || !userCoords) return;
    mapRef.current?.setUserPosition({ latitude: userCoords.lat, longitude: userCoords.lng });
  }, [userCoords, mapReady]);

  // Premier centrage de la carte : on pan vers la coord des qu'elle est
  // disponible. Ref pour ne PAS re-pan a chaque tick GPS (sinon la carte
  // ramene l'utilisateur a son point chaque fois qu'il deplace la vue).
  // Le 1er panTo declenche aussi la revelation de la carte (opacity 0 -> 1).
  const didInitialPanRef = useRef(false);
  useEffect(() => {
    if (!mapReady || !userCoords || didInitialPanRef.current) return;
    // zoom: 10 pour englober ~60km de rayon — laisse voir Miramas/Aubagne/Aix
    // depuis Marseille ou sont la plupart des missions test.
    mapRef.current?.panTo({ latitude: userCoords.lat, longitude: userCoords.lng, zoom: 10 });
    didInitialPanRef.current = true;
  }, [userCoords, mapReady]);

  useEffect(() => {
    if (!mapReady) return;
    mapRef.current?.setMissions(missionPins);
  }, [mapReady, missionPins]);

  function handleRecenter() {
    if (!userCoords) return;
    mapRef.current?.panTo({ latitude: userCoords.lat, longitude: userCoords.lng, zoom: 14 });
  }

  function handleProfile() {
    router.push('/profil');
  }

  function handleMenu() {
    setDrawerOpen(true);
  }

  function handleDrawerTabChange(tab: DrawerTab) {
    setActiveTab(tab);
    if (tab === 'courses') {
      router.push('/courses');
      setActiveTab('carte');
      return;
    }
    if (tab === 'groupes') {
      router.push('/groupes');
      setActiveTab('carte');
      return;
    }
    if (tab === 'profil') {
      router.push('/profil');
      setActiveTab('carte');
      return;
    }
  }

  function handleDrawerSignOut() {
    Alert.alert('Se déconnecter', 'Veux-tu vraiment te déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          setDrawerOpen(false);
          // Flip offline d'abord côté state local : déclenche useDriverOnlineTracking
          // qui appelle stopLocationUpdatesAsync — sinon la foregroundService Android
          // continuerait à pinger Supabase après signOut avec un token expiré.
          setIsOnline(false);
          // Flip offline en DB avant signOut (best-effort, on ne bloque pas la déconnexion si ça plante)
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

  function handlePostCourse() {
    setDrawerOpen(false);
    router.push('/poster-course');
  }

  function handleToggleFullscreen() {
    // En plein écran le MissionsSheet est démonté (rendu conditionnel),
    // donc la carte occupe vraiment 100% de l'écran. Pas besoin de close()
    // sur la ref — le composant disparaît du DOM React.
    setMapFullscreen((v) => !v);
  }

  function handleToggleMapStyle() {
    const next: MapStyle = mapStyle === 'streets' ? 'satellite' : 'streets';
    setMapStyle(next);
    mapRef.current?.setMapStyle(next);
  }

  // Clic sur un pin de la carte : affiche le popup d'infos sur l'écran
  // (comportement PWA). N'ouvre PAS le sheet — l'utilisateur a explicitement
  // tapé un pin sur la carte, il veut voir le popup, pas la liste.
  function handleSelectFromMap(id: string) {
    setSelection((prev) => (prev?.id === id ? null : { id, source: 'map' }));
  }

  // Clic sur un item dans la liste du sheet : auto-déploie à 40% et affiche la
  // barre Accepter/Détail en footer. Pas via useEffect sinon toute redescente
  // du sheet re-trigge un snap-up tant qu'une mission est sélectionnée.
  function handleSelectFromSheet(id: string) {
    const next = selection?.id === id ? null : { id, source: 'sheet' as const };
    setSelection(next);
    if (next && sheetIndex <= 0) {
      sheetRef.current?.snapToIndex(1);
    }
  }

  // Glisser le sheet vers le bas désélectionne UNIQUEMENT si la sélection
  // venait du sheet (sinon ça désélectionnerait aussi le popup de pin map).
  function handleSheetChange(index: number) {
    setSheetIndex(index);
    if (index <= 0 && selection?.source === 'sheet') {
      setSelection(null);
    }
  }

  const selectedMission = useMemo(
    () => (selectedMissionId ? filters.filteredMissions.find((x) => x.id === selectedMissionId) ?? null : null),
    [filters.filteredMissions, selectedMissionId],
  );

  // Quand on sélectionne, on vole vers la mission sur la map (comme PWA).
  useEffect(() => {
    if (!mapReady || !selectedMission) return;
    if (selectedMission.departure_lat == null || selectedMission.departure_lng == null) return;
    mapRef.current?.panTo({
      latitude: selectedMission.departure_lat,
      longitude: selectedMission.departure_lng,
      zoom: 13,
    });
  }, [mapReady, selectedMission]);

  // Toggle thème : on ne touche plus au sheet. Avec les appels NavigationBar
  // commentés dans ThemeProvider, le layout ne change plus, donc le sheet
  // n'a pas besoin de re-snap.

  async function handleAccept() {
    if (!selectedMissionId) return;
    // Célébration optimiste (cf. PWA useDriverMissions) : pouce + confettis IMMEDIATEMENT,
    // avant l'appel réseau. Si l'acceptation échoue (mission déjà prise), on l'annule.
    setShowCelebration(true);
    try {
      setAccepting(true);
      await acceptMission(selectedMissionId);
      setSelection(null);
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

  function handleShowDetail() {
    if (!selectedMissionId) return;
    router.push(`/mission/${selectedMissionId}`);
  }

  // Cache la status bar (haut) + la nav bar Android (bas, boutons back/home)
  // quand on entre en plein écran, restaure quand on sort. iOS : pas de
  // nav bar bottom — l'API expo-navigation-bar est no-op silencieusement.
  useEffect(() => {
    StatusBar.setHidden(mapFullscreen, 'slide');
    NavigationBar.setVisibilityAsync(mapFullscreen ? 'hidden' : 'visible').catch(() => {
      // expo-navigation-bar peut throw sur iOS ou en absence d'API native.
    });
    NavigationBar.setBehaviorAsync('overlay-swipe').catch(() => {
      // Permet de swipe pour faire réapparaître la nav bar temporairement
      // sans sortir du plein écran (UX standard immersive).
    });
    return () => {
      // Cleanup au démontage : restaure tout au cas où.
      StatusBar.setHidden(false);
      NavigationBar.setVisibilityAsync('visible').catch(() => {});
    };
  }, [mapFullscreen]);

  // Memes initiales que dans le drawer et la page profil : prenom + nom via
  // profileService. Avant on prenait les 2 premieres lettres de l'email, ce
  // qui donnait "MO" pour mohamed.* alors que le profil affichait "MM" --
  // incoherence visuelle entre la carte et les autres ecrans.
  const initials = extractInitials(profile?.first_name, profile?.last_name);
  const sheetCollapsed = sheetIndex <= 0;
  const showChrome = !mapFullscreen;
  // Chips de filtre visibles : sheet replié en mode normal, OU plein écran
  // (peu importe l'orientation, portrait comme paysage).
  const showFloatingChips = (showChrome && sheetCollapsed) || mapFullscreen;

  // Hauteur du 1er snap du sheet (constante exportée par MissionsSheet) —
  // sert à dimensionner le placeholder identique au sheet replié. Fixe en px
  // pour rester stable entre light/dark (cf. comment dans MissionsSheet).

  return (
    <View className="flex-1">
      <MissionMap
        ref={mapRef}
        onReady={() => setMapReady(true)}
        onSelectMission={handleSelectFromMap}
      />

      {/* Placeholder identique au sheet replié, rendu AVANT MissionsSheet donc
          en arrière. Visible uniquement les 1.5 premières secondes (le temps
          que gorhom finisse son cold start). Après il est masqué sinon il
          réapparaît en doublon avec le vrai sheet pendant les toggles thème. */}
      {!mapFullscreen && showSheetPlaceholder && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            // +10 : aligne avec MissionsSheet.bottomInset = 10 pour passer
            // au-dessus de la nav bar gestuelle Android Pixel/Samsung.
            bottom: insets.bottom + 10,
            left: 0,
            right: 0,
            height: COLLAPSED_SHEET_HEIGHT,
            backgroundColor: themeColors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            alignItems: 'center',
            paddingTop: 10,
          }}
        >
          <View
            style={{
              width: 56,
              height: 5,
              borderRadius: 999,
              backgroundColor: themeColors.border,
            }}
          />
        </View>
      )}

      {showChrome && (
        <DriverHomeTopBar
          isOnline={isOnline}
          count={filters.counts.ALL}
          initials={initials}
          nightActive={isDark}
          onToggleOnline={handleToggleOnline}
          onToggleNight={toggleTheme}
          onMenu={handleMenu}
          onProfile={handleProfile}
        />
      )}

      {/* Chips flottantes :
          - Mode normal sheet replié : sous le top bar (top dynamique pour
            respecter la status bar variable selon device — Pixel 10 Pro a
            une status bar plus grande, l'ancien hardcode 64+44+8-25=91
            faisait chevaucher les chips avec le toggle online)
          - Mode plein écran paysage : en haut de la map (top bar caché) */}
      {showFloatingChips && (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: mapFullscreen ? 16 : insets.top + 56,
            left: 0,
            right: 0,
            zIndex: 5,
          }}
        >
          <DriverHomeFilterChips
            filter={filters.filter}
            counts={filters.counts}
            urgentOnly={filters.urgentOnly}
            nearbyOnly={filters.nearbyOnly}
            hasUserCoords={!!userCoords}
            onFilterChange={filters.setFilter}
            onUrgentToggle={() => filters.setUrgentOnly(!filters.urgentOnly)}
            onNearbyToggle={() => filters.setNearbyOnly(!filters.nearbyOnly)}
            floating
          />
        </View>
      )}

      {/* Map controls : restent visibles même en plein écran, ajustés plus bas
          quand le sheet est fermé pour utiliser tout l'espace.
          Valeurs 115 (non-fullscreen) / 15 (fullscreen) = 140/40 - 25px : descente cumulée 15+10. */}
      <MapControls
        visible={sheetCollapsed}
        iconsBottom={mapFullscreen ? 40 : 115}
        zoomBottom={mapFullscreen ? 40 : 115}
        onLocate={handleRecenter}
        onZoomIn={() => mapRef.current?.zoomIn()}
        onZoomOut={() => mapRef.current?.zoomOut()}
        onLayers={handleToggleMapStyle}
        onFullscreen={handleToggleFullscreen}
      />

      <PostCourseFab
        visible={sheetCollapsed}
        bottomOffset={mapFullscreen ? 40 : 115}
        onPress={handlePostCourse}
      />

      <InfoButton
        // Sous la pile Layers/Fullscreen/Locate, dans la même colonne. 36px sous
        // Locate (44 button + 26 info + ~10px gap → bottom = iconsBottom - 36).
        bottom={(mapFullscreen ? 40 : 115) - 36}
        attribution={process.env.EXPO_PUBLIC_MAPBOX_TOKEN ? '© Mapbox © OpenStreetMap' : '© OpenStreetMap © CARTO'}
      />

      {/* Popup mission : s'affiche quand la sélection vient d'un clic sur pin
          de la carte (source = 'map'), ou en plein écran. Pour les sélections
          venant de la liste du sheet, c'est la barre d'action en footer du
          sheet qui prend le relais (selectionSource === 'sheet'). */}
      {selectedMission && (selectionSource === 'map' || mapFullscreen) && (
        <MissionMapPopup
          mission={selectedMission}
          userCoords={userCoords}
          bottom={mapFullscreen ? 12 : 110}
          accepting={accepting}
          onAccept={handleAccept}
          onShowDetail={handleShowDetail}
          onClose={() => setSelection(null)}
        />
      )}

      {!mapFullscreen && (
        <MissionsSheet
          ref={sheetRef}
          missions={filters.filteredMissions}
          // Total avant filtres chips : si l'utilisateur a Urgent/Proche/CPAM
          // actifs, le sheet affiche "6 / 11" pour expliquer pourquoi la liste
          // est plus courte que le compteur top bar.
          totalCount={filters.counts.ALL}
          selectedId={selectedMissionId}
          scopeLabel="tous mes groupes"
          userCoords={userCoords}
          onSelect={handleSelectFromSheet}
          onChange={handleSheetChange}
          // Footer barre d'action : uniquement quand la sélection vient du
          // sheet (la sélection venant d'un pin map affiche le popup à la place).
          footer={
            selectedMission && selectionSource === 'sheet' ? (
              <DriverHomeAcceptBar
                selected
                accepting={accepting}
                onAccept={handleAccept}
                onShowDetail={handleShowDetail}
              />
            ) : null
          }
          // Chips uniquement quand le sheet est ouvert ; sinon elles flottent au-dessus de la map (mutuellement exclusives)
          filterProps={
            sheetCollapsed
              ? undefined
              : {
                  filter: filters.filter,
                  counts: filters.counts,
                  urgentOnly: filters.urgentOnly,
                  nearbyOnly: filters.nearbyOnly,
                  hasUserCoords: !!userCoords,
                  onFilterChange: filters.setFilter,
                  onUrgentToggle: () => filters.setUrgentOnly(!filters.urgentOnly),
                  onNearbyToggle: () => filters.setNearbyOnly(!filters.nearbyOnly),
                }
          }
        />
      )}

      <SideBarDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeTab={activeTab}
        onTabChange={handleDrawerTabChange}
        onPostCourse={handlePostCourse}
        onSignOut={handleDrawerSignOut}
        // Nom + prénom récupérés via profileService (jamais l'email)
        name={
          profile?.first_name && profile?.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : profile?.first_name ?? 'Chauffeur'
        }
        initials={extractInitials(profile?.first_name, profile?.last_name)}
        groupName={primaryGroup}
        isOnline={isOnline}
        coursesBadge={0}
      />

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
