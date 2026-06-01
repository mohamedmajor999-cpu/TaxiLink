import { Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface Props {
  isOnline: boolean
  onToggleOnline: () => void
  missionCount: number
  initials: string
  onAvatarPress: () => void
  isDark: boolean
  onToggleTheme: () => void
}

// Overlay flottant en haut de la carte : burger menu, online/offline pill,
// theme toggle, avatar. "Ma position" est dans MapSideFabs (bottom-right).
export function TopOverlay({ isOnline, onToggleOnline, missionCount, initials, onAvatarPress, isDark, onToggleTheme }: Props) {
  return (
    <View
      pointerEvents="box-none"
      className="absolute left-3 right-3 flex-row items-center"
      style={{ top: 48, gap: 8 }}
    >
      {/* Burger */}
      <View className="bg-paper dark:bg-night-surface rounded-full w-11 h-11 items-center justify-center" style={{ shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}>
        <Ionicons name="menu" size={22} color={isDark ? '#E5E2DA' : '#1A1A1A'} />
      </View>

      {/* Online / Offline toggle */}
      <Pressable
        onPress={onToggleOnline}
        className={`flex-row items-center rounded-full ${isOnline ? 'bg-ink dark:bg-night-brand' : 'bg-paper dark:bg-night-surface'}`}
        style={{
          paddingHorizontal: 14,
          paddingVertical: 10,
          gap: 6,
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}
      >
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isOnline ? '#4ADE80' : '#9CA3AF' }} />
        <Text className={`text-xs font-sans-bold ${isOnline ? 'text-paper dark:text-secondary' : 'text-secondary dark:text-night-text'}`}>
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </Text>
        {missionCount > 0 && (
          <View className={`ml-1 px-1.5 py-0.5 rounded-full ${isOnline ? 'bg-paper' : 'bg-ink dark:bg-night-brand'}`}>
            <Text className={`text-[10px] font-sans-extrabold ${isOnline ? 'text-secondary' : 'text-paper dark:text-secondary'}`}>
              {missionCount}
            </Text>
          </View>
        )}
      </Pressable>

      {/* Spacer : pousse theme + avatar a droite */}
      <View style={{ flex: 1 }} />

      {/* Theme toggle (soleil/lune) */}
      <Pressable
        onPress={onToggleTheme}
        className="bg-paper dark:bg-night-surface rounded-full w-11 h-11 items-center justify-center"
        style={{ shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}
        hitSlop={6}
      >
        <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={isDark ? '#FFD23F' : '#1A1A1A'} />
      </Pressable>

      {/* Avatar */}
      <Pressable
        onPress={onAvatarPress}
        className="bg-ink rounded-full w-11 h-11 items-center justify-center"
        style={{ shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5 }}
      >
        <Text className="text-paper font-sans-extrabold text-sm">{initials}</Text>
      </Pressable>
    </View>
  )
}
