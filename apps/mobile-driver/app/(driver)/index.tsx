import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from 'react-native'
import { Stack, router } from 'expo-router'
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet'

import type { Mission } from '@taxilink/supabase-types'
import { authService, reportError } from '@taxilink/services'

import { useAuth } from '@/hooks/useAuth'
import { useNightMode } from '@/hooks/useNightMode'
import { MissionMap, type MissionMapHandle } from '@/components/missions/MissionMap'
import { TopOverlay } from '@/components/missions/TopOverlay'
import { FilterChips } from '@/components/missions/FilterChips'
import { PostCourseFab } from '@/components/missions/PostCourseFab'
import { MissionSheetCard } from '@/components/missions/MissionSheetCard'
import { ZoomControls } from '@/components/missions/ZoomControls'
import { MapSideFabs } from '@/components/missions/MapSideFabs'
import { useDriverMissionsScreen } from '@/components/missions/useDriverMissionsScreen'

// Ecran principal chauffeur (Sem 4 v2 redesign) :
// - Map plein ecran avec pins prix (OSM tiles gratuit)
// - Bottom sheet draggable avec FilterChips + liste missions
// - Top overlay : burger menu, online/offline, locate, avatar
// - FAB "Poster une course" au-dessus de la tab bar
// - Tab bar bottom (4 onglets visuels Sem 4, navigation reelle Sem 10+)
//
// Selection : tap card -> highlight + map pan vers le pin. Tap pin -> selectionne.
// Accept : sticky CTA "Accepter <prix>" visible quand une mission est selectionnee.
export default function DriverHomeScreen() {
  const { user } = useAuth()
  const { isDark, toggle: toggleTheme } = useNightMode()
  const {
    missions,
    loading,
    error,
    selectedId,
    setSelectedId,
    filter,
    setFilter,
    counts,
    userCoords,
    isOnline,
    toggleOnline,
    refresh,
    refreshing,
    accept,
    accepting,
  } = useDriverMissionsScreen()

  const mapRef = useRef<MissionMapHandle>(null)
  const sheetRef = useRef<BottomSheet>(null)

  // Snap points pour le sheet : 30% (peek), 60% (mid), 92% (presque full)
  const snapPoints = useMemo(() => ['30%', '60%', '92%'], [])

  // Pan vers le pin quand l'user tape une card
  useEffect(() => {
    if (!selectedId) return
    const m = missions.find((mm) => mm.id === selectedId)
    if (m) mapRef.current?.panToMission(m)
  }, [selectedId, missions])

  const handleSelectMission = useCallback((id: string) => {
    setSelectedId((cur) => (cur === id ? null : id))
    // Ouvre le sheet a mi-hauteur pour voir la card selectionnee + le CTA accept.
    sheetRef.current?.snapToIndex(1)
  }, [setSelectedId])

  const handleAcceptSelected = useCallback(() => {
    if (!selectedId) return
    accept(selectedId)
  }, [selectedId, accept])

  const handlePostCourse = useCallback(() => {
    Alert.alert('Bientot dispo', 'Le partage de course depuis le mobile arrive en Sem 5+.')
  }, [])

  const handleAvatarPress = useCallback(async () => {
    Alert.alert(
      'Profil',
      'Le menu profil arrive en Sem 10. Tu peux te deconnecter ici en attendant.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se deconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.signOut()
              router.replace('/login')
            } catch (err) {
              reportError(err, { tags: { phase: 'sign-out' } })
            }
          },
        },
      ],
    )
  }, [])

  const initials = useMemo(() => {
    const meta = user?.user_metadata ?? {}
    const fn = typeof meta.first_name === 'string' ? meta.first_name : ''
    const ln = typeof meta.last_name === 'string' ? meta.last_name : ''
    return `${fn.charAt(0)}${ln.charAt(0)}`.toUpperCase() || 'TL'
  }, [user])

  const selectedMission = useMemo(
    () => missions.find((m) => m.id === selectedId) ?? null,
    [missions, selectedId],
  )

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 bg-bgsoft dark:bg-night-bg">
        {/* MAP FULLSCREEN */}
        <MissionMap
          ref={mapRef}
          missions={missions}
          selectedId={selectedId}
          onSelectMission={handleSelectMission}
          userCoords={userCoords}
        />

        {/* TOP OVERLAY */}
        <TopOverlay
          isOnline={isOnline}
          onToggleOnline={toggleOnline}
          missionCount={counts.all}
          initials={initials}
          onAvatarPress={handleAvatarPress}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />

        {/* FILTER CHIPS sur la carte, sous la top bar (style PWA) */}
        <View
          pointerEvents="box-none"
          className="absolute left-0 right-0"
          style={{ top: 104 }}
        >
          <FilterChips filter={filter} setFilter={setFilter} counts={counts} />
        </View>

        {/* ZOOM CONTROLS (bottom-left, au-dessus du FAB/CTA) */}
        <ZoomControls
          onZoomIn={() => mapRef.current?.zoomIn()}
          onZoomOut={() => mapRef.current?.zoomOut()}
          bottom={120}
        />

        {/* MA POSITION + LAYERS + AGRANDIR (bottom-right, style PWA) */}
        <MapSideFabs
          bottom={120}
          isDark={isDark}
          onLocate={() => mapRef.current?.panToUser()}
          onExpand={() => sheetRef.current?.snapToIndex(0)}
        />

        {/* BOTTOM SHEET en peek pour laisser la carte respirer */}
        <BottomSheet
          ref={sheetRef}
          index={0}
          snapPoints={snapPoints}
          backgroundStyle={{ backgroundColor: isDark ? '#1E2026' : '#FFFFFF' }}
          handleIndicatorStyle={{ backgroundColor: isDark ? '#383A42' : '#D4D4D4', width: 44 }}
          enablePanDownToClose={false}
          topInset={0}
        >
          <View className="px-4 pt-2 pb-3">
            <View className="flex-row items-baseline justify-between">
              <Text className="text-lg font-sans-extrabold text-ink dark:text-night-text">Annonces autour de vous</Text>
              <Text className="text-xs text-muted dark:text-night-text-soft">{counts.all} · {filter === 'all' ? 'tous mes groupes' : filter}</Text>
            </View>
          </View>

          {loading ? (
            <View className="flex-1 items-center justify-center" style={{ paddingTop: 40 }}>
              <ActivityIndicator size="large" color="#FFD23F" />
            </View>
          ) : error ? (
            <View className="items-center" style={{ paddingTop: 40 }}>
              <Text className="text-danger font-sans-semibold mb-2">⚠ {error}</Text>
              <Pressable onPress={refresh} className="px-4 py-2 rounded-xl bg-primary">
                <Text className="font-sans-bold text-secondary">Reessayer</Text>
              </Pressable>
            </View>
          ) : missions.length === 0 ? (
            <View className="items-center" style={{ paddingTop: 40 }}>
              <Text className="text-4xl mb-3">🅿️</Text>
              <Text className="text-secondary dark:text-night-text font-sans-bold text-base">Aucune course</Text>
              <Text className="text-muted dark:text-night-text-soft text-sm mt-1 text-center px-8">
                {filter !== 'all'
                  ? 'Aucune course ne correspond a ce filtre. Essaie "Tout".'
                  : 'Les nouvelles courses apparaitront ici en temps reel.'}
              </Text>
            </View>
          ) : (
            <BottomSheetFlatList
              data={missions}
              keyExtractor={(m: Mission) => m.id}
              contentContainerStyle={{ padding: 16, paddingBottom: 200, gap: 10 }}
              renderItem={({ item }) => (
                <MissionSheetCard
                  mission={item}
                  selected={selectedId === item.id}
                  userCoords={userCoords}
                  onSelect={handleSelectMission}
                />
              )}
              refreshing={refreshing}
              onRefresh={refresh}
            />
          )}
        </BottomSheet>

        {/* CTA ACCEPTER quand une mission est selectionnee */}
        {selectedMission && (
          <View
            pointerEvents="box-none"
            className="absolute left-0 right-0 px-4"
            style={{ bottom: 40 }}
          >
            <Pressable
              onPress={handleAcceptSelected}
              disabled={accepting}
              className="bg-primary rounded-2xl flex-row items-center justify-center"
              style={{
                paddingVertical: 16,
                shadowColor: '#FFD23F',
                shadowOpacity: 0.4,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
                elevation: 8,
                opacity: accepting ? 0.6 : 1,
              }}
            >
              {accepting ? (
                <ActivityIndicator color="#1A1A1A" />
              ) : (
                <Text className="font-sans-extrabold text-secondary text-base">
                  Accepter cette course
                </Text>
              )}
            </Pressable>
          </View>
        )}

        {/* FAB Poster (cache si une course est selectionnee, pour laisser place au CTA) */}
        {!selectedMission && <PostCourseFab onPress={handlePostCourse} bottom={40} />}
      </View>
    </>
  )
}
