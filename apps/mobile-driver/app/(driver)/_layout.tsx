import { Redirect, Stack } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'

import { useAuth } from '@/hooks/useAuth'

// Driver route group : ecrans accessibles UNIQUEMENT logge.
// Si user pas logge -> redirect vers /login.
// Equivalent du middleware web qui matche /dashboard/:path*.
export default function DriverLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bgsoft">
        <ActivityIndicator size="large" color="#FFD23F" />
      </View>
    )
  }

  if (!user) {
    return <Redirect href="/login" />
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#FFD23F' },
        headerTintColor: '#1A1A1A',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#F8F9FA' },
      }}
    />
  )
}
