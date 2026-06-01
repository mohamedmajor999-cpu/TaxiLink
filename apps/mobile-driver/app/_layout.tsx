import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StatusBar } from 'expo-status-bar'
import '../global.css'

import { initApp } from '@/lib/init'

// Init au module load (avant le 1er rendu).
// Idempotent : un seul call effectif meme si le module est re-importe.
initApp()

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F8F9FA' },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(driver)" />
      </Stack>
    </GestureHandlerRootView>
  )
}
