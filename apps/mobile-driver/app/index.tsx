import { Text, View, Pressable, ScrollView } from 'react-native'
import { Stack } from 'expo-router'

import { reportError } from '@taxilink/services'

export default function HomeScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'TaxiLink Chauffeur' }} />
      <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
        <View className="rounded-3xl bg-primary p-6">
          <Text className="text-3xl font-sans-extrabold text-secondary">
            Hello TaxiLink
          </Text>
          <Text className="mt-2 text-base text-secondary">
            Bootstrap Phase 1 Sem 1 — l&apos;app boot, NativeWind est branche, les
            packages partages sont init.
          </Text>
        </View>

        <View className="rounded-2xl bg-paper p-5 border border-line">
          <Text className="text-xs uppercase tracking-wide text-muted">
            Etat de l&apos;app
          </Text>
          <StatusRow label="NativeWind" value="OK" />
          <StatusRow
            label="Supabase"
            value={hasEnv('EXPO_PUBLIC_SUPABASE_URL') ? 'configure' : 'manquant'}
            ok={hasEnv('EXPO_PUBLIC_SUPABASE_URL')}
          />
          <StatusRow
            label="Sentry DSN"
            value={hasEnv('EXPO_PUBLIC_SENTRY_DSN') ? 'configure' : 'manquant'}
            ok={hasEnv('EXPO_PUBLIC_SENTRY_DSN')}
          />
          <StatusRow
            label="Google Maps"
            value={hasEnv('EXPO_PUBLIC_GOOGLE_MAPS_KEY') ? 'configure' : 'manquant'}
            ok={hasEnv('EXPO_PUBLIC_GOOGLE_MAPS_KEY')}
          />
        </View>

        <Pressable
          onPress={triggerSentryTest}
          className="rounded-2xl bg-danger p-4 active:opacity-80"
        >
          <Text className="text-center font-sans-bold text-paper">
            Crash test Sentry
          </Text>
          <Text className="text-center text-paper text-xs mt-1 opacity-80">
            doit apparaitre dans le dashboard Sentry sous quelques secondes
          </Text>
        </Pressable>
      </ScrollView>
    </>
  )
}

function StatusRow({
  label,
  value,
  ok = true,
}: {
  label: string
  value: string
  ok?: boolean
}) {
  return (
    <View className="flex-row justify-between py-2 border-b border-line last:border-b-0">
      <Text className="text-secondary">{label}</Text>
      <Text className={ok ? 'text-secondary font-sans-semibold' : 'text-danger font-sans-semibold'}>
        {value}
      </Text>
    </View>
  )
}

function hasEnv(key: string): boolean {
  // process.env est inline a la compile par Expo pour les vars EXPO_PUBLIC_*.
  // L'acces dynamique via une variable n'est PAS substitue, donc on switch.
  switch (key) {
    case 'EXPO_PUBLIC_SUPABASE_URL':
      return Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL)
    case 'EXPO_PUBLIC_SENTRY_DSN':
      return Boolean(process.env.EXPO_PUBLIC_SENTRY_DSN)
    case 'EXPO_PUBLIC_GOOGLE_MAPS_KEY':
      return Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY)
    default:
      return false
  }
}

function triggerSentryTest() {
  try {
    throw new Error('Crash test mobile-driver Sem 1 — declenche depuis index.tsx')
  } catch (err) {
    reportError(err, { tags: { phase: 'sem-1-bootstrap' } })
  }
}
