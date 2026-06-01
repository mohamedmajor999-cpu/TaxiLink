import '../global.css';
// Import side-effect : enregistre la tâche TaskManager au boot du bundle JS,
// AVANT que le système puisse réveiller le process en background pour livrer
// une location update. Sans ça, le réveil background crashe avec "Task not found".
import '@/tasks/driverLocationTask';

import { router, Stack, usePathname } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SystemBars } from 'react-native-edge-to-edge';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';

import { useVolumeShortcut } from '@/hooks/useVolumeShortcut';
import { initApp } from '@/lib/init';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';

initApp();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedRoot />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Wrapper qui consomme useTheme : la couleur de fond du root + le style des
// system bars (status bar haut + nav bar Android bas) suivent le thème.
// `SystemBars` de react-native-edge-to-edge pilote dynamiquement la couleur
// des icônes système sans déclencher la cascade Android Configuration change
// qui décalait le sheet (contrairement à NavigationBar.setBackgroundColorAsync).
// La couleur visible du nav bar zone = couleur de fond du root View (transparente
// nav bar en edge-to-edge).
function ThemedRoot() {
  const { isDark, colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SystemBars style={isDark ? 'light' : 'dark'} />
      <AppErrorBoundary>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
      </AppErrorBoundary>
      <VolumeShortcutBridge />
    </View>
  );
}

/**
 * Branche Volume+ à un raccourci global "nouvelle annonce vocale".
 * Désactivé sur les pages d'auth et poster-course (déjà sur place).
 */
function VolumeShortcutBridge() {
  const pathname = usePathname();
  const onAuth = pathname?.startsWith('/(auth)') || pathname === '/login' || pathname === '/register'
    || pathname === '/forgot-password' || pathname === '/reset-password' || pathname === '/complete-profile'
    || pathname === '/onboarding';
  const onPoster = pathname === '/poster-course';
  useVolumeShortcut({
    enabled: !onAuth && !onPoster,
    onTrigger: () => router.push('/poster-course?quick=1'),
  });
  return null;
}
