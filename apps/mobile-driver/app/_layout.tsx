import { Stack } from 'expo-router'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StatusBar } from 'expo-status-bar'
import '../global.css'

import { initApp } from '@/lib/init'

initApp()

export default function RootLayout() {
  useEffect(() => {
    // Place pour useFonts() etc. en Sem 11 polish.
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#FFD23F' },
          headerTintColor: '#1A1A1A',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#F8F9FA' },
        }}
      />
    </GestureHandlerRootView>
  )
}
