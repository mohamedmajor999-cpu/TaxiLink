import { Redirect, Stack } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'

import { useAuth } from '@/hooks/useAuth'

// Auth route group : ecrans accessibles UNIQUEMENT non-logge.
// Si user deja logge -> redirect vers le dashboard chauffeur.
// Equivalent inverse du middleware web (apps/web/src/middleware.ts).
export default function AuthLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bgsoft">
        <ActivityIndicator size="large" color="#FFD23F" />
      </View>
    )
  }

  if (user) {
    return <Redirect href="/" />
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F8F9FA' },
      }}
    />
  )
}
