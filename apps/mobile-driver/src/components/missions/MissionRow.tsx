import { memo } from 'react'
import { Pressable, Text, View } from 'react-native'

import { computeDisplayFare } from '@taxilink/core'
import type { Mission } from '@taxilink/supabase-types'

interface Props {
  mission: Mission
  selected: boolean
  onSelect: (id: string) => void
}

const URGENT_THRESHOLD_MIN = 10

// Port direct de MissionSheetItem.tsx (apps/web).
// Card avec adresses depart/destination, badge type, delai colore, prix + distance.
// `memo` car la liste re-render souvent en realtime, eviter le diff inutile.
function MissionRowImpl({ mission, selected, onSelect }: Props) {
  const minutesUntil = getMinutesUntil(mission.scheduled_at)
  const urgent = minutesUntil <= URGENT_THRESHOLD_MIN
  const isCpam = mission.type === 'CPAM'
  const fareDisplay = computeDisplayFare(mission)

  return (
    <Pressable
      onPress={() => onSelect(mission.id)}
      className={`rounded-2xl bg-paper ${selected ? 'border-2 border-ink p-3.5' : 'border border-warm-200 p-3.5'}`}
    >
      <View className="flex-row" style={{ gap: 10 }}>
        {/* Left : adresses */}
        <View className="flex-1">
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <View className="w-2.5 h-2.5 rounded-full bg-ink" />
            <Text className="flex-1 text-sm font-sans-semibold text-ink" numberOfLines={1}>
              {mission.departure}
            </Text>
          </View>
          <View className="w-0.5 h-3 bg-warm-200 my-0.5" style={{ marginLeft: 4.5 }} />
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <View className="w-3 h-3 rounded-full bg-brand border-2 border-ink" />
            <Text className="flex-1 text-sm font-sans-medium text-warm-500" numberOfLines={1}>
              {mission.destination}
            </Text>
          </View>

          {/* Badge + delai + urgent */}
          <View className="flex-row items-center mt-2" style={{ gap: 6, paddingLeft: 26 }}>
            <View className={`px-1.5 py-0.5 rounded ${isCpam ? 'bg-danger-soft' : 'bg-accent'}`} style={isCpam ? undefined : { backgroundColor: '#DBEAFE' }}>
              <Text className={`text-[10px] font-sans-extrabold uppercase ${isCpam ? 'text-danger' : ''}`} style={isCpam ? { color: '#991B1B' } : { color: '#1E40AF' }}>
                {isCpam ? 'CPAM' : 'Prive'}
              </Text>
            </View>
            <Text className={`text-[11px] font-sans-bold ${delayColorClass(minutesUntil)}`}>
              · {minutesUntil <= 0 ? 'Maintenant' : `Dans ${formatDuration(minutesUntil)}`}
              {mission.return_trip ? ' · A/R' : ''}
            </Text>
            {urgent && (
              <Text className="text-[10.5px] font-sans-extrabold text-danger">⚠ Urgent</Text>
            )}
          </View>
        </View>

        {/* Right : prix + distance */}
        <View className="items-end" style={{ gap: 2 }}>
          <Text className="text-base font-sans-extrabold text-ink">
            {fareDisplay.isEstimated ? '~' : ''}{fareDisplay.value.toFixed(2).replace('.', ',')} €
          </Text>
          {mission.distance_km != null && (
            <Text className="text-[11px] text-ink font-sans-semibold">
              {Number(mission.distance_km) < 10
                ? Number(mission.distance_km).toFixed(1)
                : Number(mission.distance_km).toFixed(0)} km
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  )
}

export const MissionRow = memo(MissionRowImpl)

// --- utils inlines (equivalents apps/web/src/lib/dateUtils, formatDuration) ---

function getMinutesUntil(iso: string | null): number {
  if (!iso) return 9999
  const target = new Date(iso).getTime()
  const now = Date.now()
  return Math.round((target - now) / 60000)
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h < 24) return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
  const days = Math.floor(h / 24)
  return `${days}j`
}

function delayColorClass(minutes: number): string {
  if (minutes <= URGENT_THRESHOLD_MIN) return 'text-danger'
  if (minutes < 60) return 'text-warm-800'
  if (minutes < 1440) return 'text-ink'
  return 'text-warm-500'
}
