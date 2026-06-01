import { memo } from 'react'
import { Pressable, Text, View } from 'react-native'

import { computeDisplayFare } from '@taxilink/core'
import type { Mission } from '@taxilink/supabase-types'

interface Props {
  mission: Mission
  selected: boolean
  userCoords: { lat: number; lng: number } | null
  onSelect: (id: string) => void
}

const URGENT_THRESHOLD_MIN = 10

// Carte mission dans le bottom sheet. Port direct du MissionSheetItem PWA :
// depart en dot noir + ligne verticale + destination en cercle jaune, badge type,
// delai colore, prix big a droite + distance pickup + distance course.
function MissionSheetCardImpl({ mission, selected, userCoords, onSelect }: Props) {
  const minutesUntil = getMinutesUntil(mission.scheduled_at)
  const urgent = minutesUntil <= URGENT_THRESHOLD_MIN
  const isCpam = mission.type === 'CPAM'
  const fareDisplay = computeDisplayFare(mission)
  const courseKm = mission.distance_km != null ? Number(mission.distance_km) : null
  const pickupKm = userCoords && mission.departure_lat && mission.departure_lng
    ? haversineKm(userCoords, { lat: Number(mission.departure_lat), lng: Number(mission.departure_lng) })
    : null

  return (
    <Pressable
      onPress={() => onSelect(mission.id)}
      className={`rounded-2xl bg-paper dark:bg-night-surface ${selected ? 'border-2 border-ink dark:border-night-brand p-3' : 'border border-warm-200 dark:border-night-border p-3'}`}
      style={selected ? {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
      } : undefined}
    >
      <View className="flex-row" style={{ gap: 10 }}>
        {/* Left : adresses */}
        <View className="flex-1">
          <View className="flex-row items-center" style={{ gap: 10 }}>
            <View className="w-2.5 h-2.5 rounded-full bg-ink dark:bg-night-text" />
            <Text className="flex-1 text-sm font-sans-semibold text-ink dark:text-night-text" numberOfLines={1}>
              {mission.departure}
            </Text>
          </View>
          <View className="w-0.5 h-3 bg-warm-200 dark:bg-night-border my-0.5" style={{ marginLeft: 4.5 }} />
          <View className="flex-row items-center" style={{ gap: 10 }}>
            <View className="w-3 h-3 rounded-full bg-brand dark:bg-night-brand border-2 border-ink dark:border-night-text" />
            <Text className="flex-1 text-sm font-sans-medium text-warm-500 dark:text-night-text-soft" numberOfLines={1}>
              {mission.destination}
            </Text>
          </View>

          {/* Badge + delai + urgent */}
          <View className="flex-row items-center mt-2" style={{ gap: 6, paddingLeft: 22 }}>
            <View className="px-1.5 py-0.5 rounded" style={{ backgroundColor: isCpam ? '#FEE2E2' : '#DBEAFE' }}>
              <Text className="text-[10px] font-sans-extrabold uppercase" style={{ color: isCpam ? '#991B1B' : '#1E40AF' }}>
                {isCpam ? 'CPAM' : 'Prive'}
              </Text>
            </View>
            <Text className={`text-[11px] font-sans-bold ${delayColorClass(minutesUntil)}`}>
              · {minutesUntil <= 0 ? 'Maintenant' : `Dans ${formatDuration(minutesUntil)}`}
              {mission.return_trip ? ' · A/R' : ''}
            </Text>
            {urgent && (
              <Text className="text-[10.5px] font-sans-extrabold text-danger">⚡ Urgent</Text>
            )}
          </View>
        </View>

        {/* Right : prix + distances */}
        <View className="items-end" style={{ gap: 2 }}>
          <Text className="text-lg font-sans-extrabold text-ink dark:text-night-brand">
            {fareDisplay.isEstimated ? '~' : ''}{fareDisplay.value.toFixed(2).replace('.', ',')} €
          </Text>
          {pickupKm != null && (
            <Text className="text-[11px] text-muted dark:text-night-text-soft font-sans-semibold">
              📍 {pickupKm < 10 ? pickupKm.toFixed(1) : pickupKm.toFixed(0)} km
            </Text>
          )}
          {courseKm != null && (
            <Text className="text-[11px] text-ink dark:text-night-text font-sans-semibold">
              🚗 {courseKm < 10 ? courseKm.toFixed(1) : courseKm.toFixed(0)} km
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  )
}

export const MissionSheetCard = memo(MissionSheetCardImpl)

function getMinutesUntil(iso: string | null): number {
  if (!iso) return 9999
  return Math.round((new Date(iso).getTime() - Date.now()) / 60000)
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h < 24) return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
  return `${Math.floor(h / 24)}j`
}

function delayColorClass(minutes: number): string {
  if (minutes <= URGENT_THRESHOLD_MIN) return 'text-danger'
  if (minutes < 60) return 'text-warm-800'
  if (minutes < 1440) return 'text-ink'
  return 'text-warm-500'
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}
