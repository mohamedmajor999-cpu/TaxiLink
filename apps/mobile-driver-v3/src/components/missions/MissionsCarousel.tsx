import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import type { Mission } from '@taxilink/supabase-types';
import { computeDisplayFare } from '@taxilink/core';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';
import { haversineKm } from '@/lib/geo';
import { formatKm, formatDuration } from '@/lib/format';
import { useHoldAccept } from '@/hooks/useHoldAccept';

const SIDE_PADDING = 16;
const CARD_GAP = 10;
const URGENT_THRESHOLD_MIN = 10;
// Hauteur du BottomNav (= 64 dans BottomNav.tsx). Le carousel doit flotter
// AU-DESSUS de la nav pour ne pas etre recouvert.
const BOTTOM_NAV_HEIGHT = 64;

interface Props {
  missions: Mission[];
  totalCount: number;
  selectedId: string | null;
  userCoords: { lat: number; lng: number } | null;
  accepting: boolean;
  onSelect: (id: string) => void;
  onAccept: (id: string) => void;
  onShowDetail: (id: string) => void;
}

// Carousel horizontal Bolt-style — remplace l'ancien MissionsSheet. Chaque card
// = mission cliquable avec CTA "Accepter" + chevron "Detail". Le scroll-snap
// natif RN FlatList se charge du snap par card.
export function MissionsCarousel({
  missions,
  totalCount,
  selectedId,
  userCoords,
  accepting,
  onSelect,
  onAccept,
  onShowDetail,
}: Props) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  // Card responsive : recalcule a chaque rotation / split-screen / changement
  // de taille de fenetre. Sur petit ecran (≤ 360px) plus serre, sur grand
  // ecran plafonne a 340. Le `-40` au final laisse l'amorce de la card suivante
  // visible a droite (preserve le look "carousel").
  const cardWidth = useMemo(
    () => Math.max(240, Math.min(340, windowWidth - SIDE_PADDING * 2 - 40)),
    [windowWidth],
  );
  const listRef = useRef<FlatList<Mission>>(null);
  const [visibleIndex, setVisibleIndex] = useState(0);

  // Quand selectedId change (clic sur pin map), on scroll le carousel vers
  // cette card. Synchronise list <-> map sans re-render en boucle.
  useEffect(() => {
    if (!selectedId) return;
    const idx = missions.findIndex((m) => m.id === selectedId);
    if (idx >= 0 && idx !== visibleIndex) {
      listRef.current?.scrollToIndex({ index: idx, animated: true });
      setVisibleIndex(idx);
    }
  }, [selectedId, missions, visibleIndex]);

  function handleMomentumScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const offset = e.nativeEvent.contentOffset.x;
    const idx = Math.round(offset / (cardWidth + CARD_GAP));
    const clamped = Math.max(0, Math.min(missions.length - 1, idx));
    setVisibleIndex(clamped);
    const mission = missions[clamped];
    if (mission && mission.id !== selectedId) onSelect(mission.id);
  }

  if (missions.length === 0) {
    return (
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: insets.bottom + BOTTOM_NAV_HEIGHT + 12,
        }}
      >
        <View
          style={{
            marginHorizontal: SIDE_PADDING,
            backgroundColor: colors.surfaceElevated,
            borderRadius: 18,
            paddingVertical: 16,
            paddingHorizontal: 18,
            borderWidth: 1,
            borderColor: colors.border,
            ...float(isDark),
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.ink }}>
            Aucune course disponible
          </Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.inkSoft, marginTop: 2 }}>
            Les nouvelles missions s'affichent ici en temps reel.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: insets.bottom + BOTTOM_NAV_HEIGHT + 8,
      }}
    >
      <FlatList
        ref={listRef}
        horizontal
        data={missions}
        keyExtractor={(m) => m.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + CARD_GAP}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: SIDE_PADDING, gap: CARD_GAP }}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        renderItem={({ item, index }) => (
          <RideCard
            mission={item}
            active={index === visibleIndex}
            userCoords={userCoords}
            accepting={accepting && item.id === selectedId}
            cardWidth={cardWidth}
            onPress={() => onSelect(item.id)}
            onAccept={() => onAccept(item.id)}
            onShowDetail={() => onShowDetail(item.id)}
          />
        )}
      />

      <Dots count={Math.min(missions.length, 6)} activeIndex={Math.min(visibleIndex, 5)} totalCount={totalCount} colors={colors} />
    </View>
  );
}

function Dots({
  count,
  activeIndex,
  totalCount,
  colors,
}: {
  count: number;
  activeIndex: number;
  totalCount: number;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            height: 6,
            width: i === activeIndex ? 20 : 6,
            borderRadius: 3,
            backgroundColor: i === activeIndex ? colors.ink : colors.border,
          }}
        />
      ))}
      {totalCount > count && (
        <Text style={{ marginLeft: 6, fontSize: 11, fontWeight: '800', color: colors.inkSoft }}>
          +{totalCount - count}
        </Text>
      )}
    </View>
  );
}

interface CardProps {
  mission: Mission;
  active: boolean;
  userCoords: { lat: number; lng: number } | null;
  accepting: boolean;
  cardWidth: number;
  onPress: () => void;
  onAccept: () => void;
  onShowDetail: () => void;
}

function RideCard({ mission, active, userCoords, accepting, cardWidth, onPress, onAccept, onShowDetail }: CardProps) {
  const { colors, isDark } = useTheme();
  // Hold-to-confirm 1.25s : voir le bouton se "remplir" avant validation.
  // Pas d'accept par tap accidentel sur la card pendant le scroll horizontal.
  const hold = useHoldAccept({ onConfirm: onAccept, duration: 1250, disabled: accepting });
  const fillWidth = hold.progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const holdLabel =
    hold.state === 'confirmed' ? 'Acceptée' : hold.state === 'pressing' ? 'Maintenez…' : 'Accepter';
  const minutesUntil = getMinutesUntil(mission.scheduled_at);
  const urgent = minutesUntil <= URGENT_THRESHOLD_MIN;
  const isCpam = mission.type === 'CPAM';
  const fare = computeDisplayFare(mission).value;

  const pickupKm =
    userCoords && mission.departure_lat != null && mission.departure_lng != null
      ? haversineKm(userCoords, { lat: mission.departure_lat, lng: mission.departure_lng })
      : null;
  const courseKm =
    mission.distance_km != null
      ? mission.distance_km
      : mission.departure_lat != null && mission.departure_lng != null
        && mission.destination_lat != null && mission.destination_lng != null
        ? haversineKm(
            { lat: mission.departure_lat, lng: mission.departure_lng },
            { lat: mission.destination_lat, lng: mission.destination_lng },
          )
        : null;

  return (
    <Pressable onPress={onPress} style={{ width: cardWidth }}>
      <View
        style={{
          backgroundColor: colors.surfaceElevated,
          borderRadius: 22,
          padding: 14,
          borderWidth: active ? 2 : 1,
          borderColor: active ? (isDark ? colors.accent : '#0F0F0F') : colors.border,
          ...float(isDark),
        }}
      >
        {/* Head : tags + prix */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {/* Code couleur aligne sur les pins map + PWA : CPAM = rouge medical,
                PRIVE = bleu passager. Le user voit la meme info (couleur+pico)
                qu'il regarde la carte ou les cartes annonces. */}
            <Tag
              label={isCpam ? 'CPAM' : 'PRIVÉ'}
              bg={isCpam ? '#FEE2E2' : '#DBEAFE'}
              ink={isCpam ? '#DC2626' : '#2563EB'}
            />
            {urgent && <Tag label="URGENT" bg={colors.dangerSoft} ink={colors.danger} />}
          </View>
          <Text style={{ fontSize: 22, fontWeight: '900', color: colors.ink, letterSpacing: -0.8 }}>
            {Math.round(fare)} €
          </Text>
        </View>

        {/* Trip : dots + adresses */}
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <View style={{ alignItems: 'center', paddingTop: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.ink }} />
            <View style={{ width: 2, height: 18, backgroundColor: colors.border, marginVertical: 3 }} />
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: colors.brand,
                borderWidth: 2,
                borderColor: colors.ink,
              }}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '700', color: colors.ink }}>
              {mission.departure}
            </Text>
            <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '700', color: colors.ink, marginTop: 14 }}>
              {mission.destination}
            </Text>
          </View>
        </View>

        {/* Meta : distances + heure */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 12, alignItems: 'center' }}>
          {pickupKm != null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="map-pin" size={11} color={colors.inkSoft} strokeWidth={2.2} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.inkSoft }}>
                {formatKm(pickupKm)} km
              </Text>
            </View>
          )}
          {courseKm != null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="route" size={11} color={colors.ink} strokeWidth={2.2} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.ink }}>
                {formatKm(courseKm)} km
              </Text>
            </View>
          )}
          <Text style={{ fontSize: 11, fontWeight: '700', color: delayColor(minutesUntil, colors) }}>
            {minutesUntil <= 0 ? 'Maintenant' : `Dans ${formatDuration(minutesUntil)}`}
          </Text>
        </View>

        {/* CTA row : Accepter (hold-to-confirm 1.25s avec fill anim) + chevron Detail */}
        <View style={{ flexDirection: 'row', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
          <View style={{ flex: 1, height: 42, borderRadius: 12, overflow: 'hidden' }}>
            {/* Background noir fixe */}
            <View
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: isDark ? colors.accent : '#0F0F0F',
              }}
            />
            {/* Fill brand qui grossit pendant le hold */}
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0, left: 0, bottom: 0,
                width: fillWidth,
                backgroundColor: '#FFD11A',
              }}
            />
            {/* Label centre par-dessus le fill */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {accepting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  numberOfLines={1}
                  style={{ fontSize: 14, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.2 }}
                >
                  {holdLabel}
                </Text>
              )}
            </View>
            {/* Pressable plein cadre : maintain press = hold */}
            <Pressable
              onPressIn={hold.start}
              onPressOut={hold.cancel}
              disabled={accepting}
              accessibilityRole="button"
              accessibilityLabel="Maintenir pour accepter la course"
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'transparent',
              }}
            />
          </View>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: colors.surfaceMuted,
              overflow: 'hidden',
            }}
          >
            <Pressable
              onPress={onShowDetail}
              android_ripple={{ color: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)' }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="chevron-right" size={18} color={colors.ink} strokeWidth={2.4} />
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function Tag({ label, bg, ink }: { label: string; bg: string; ink: string }) {
  return (
    <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: bg }}>
      <Text style={{ fontSize: 10, fontWeight: '900', color: ink, letterSpacing: 0.4 }}>{label}</Text>
    </View>
  );
}

function float(isDark: boolean) {
  return {
    shadowColor: '#000',
    shadowOpacity: isDark ? 0.45 : 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  };
}

function getMinutesUntil(iso: string | null): number {
  if (!iso) return Infinity;
  return Math.round((new Date(iso).getTime() - Date.now()) / 60000);
}

function delayColor(minutes: number, colors: { danger: string; ink: string; inkSoft: string }): string {
  if (minutes <= URGENT_THRESHOLD_MIN) return colors.danger;
  if (minutes < 60) return '#F59E0B';
  if (minutes < 1440) return colors.ink;
  return colors.inkSoft;
}
