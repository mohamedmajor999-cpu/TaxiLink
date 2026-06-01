import { Redirect, Stack, usePathname } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import { useOnboardingSeen } from '@/components/onboarding/useOnboardingSeen';

// Force login comme ecran initial du Stack : sans ca, Expo Router peut prendre
// le premier fichier par ordre alphabetique (complete-profile) au cold start.
export const unstable_settings = {
  initialRouteName: 'login',
};

// Auth group : login/register/forgot accessibles UNIQUEMENT non-loggé.
// Exception : /complete-profile accessible aux loggés au profil incomplet.
// 1er lancement (onboarding non vu + pas user) → redirect /onboarding.
export default function AuthLayout() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const onboardingSeen = useOnboardingSeen();

  if (loading || onboardingSeen === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-bgsoft">
        <ActivityIndicator size="large" color="#FFD23F" />
      </View>
    );
  }

  if (!user && onboardingSeen === 'unseen') {
    return <Redirect href="/onboarding" />;
  }

  if (user && pathname !== '/complete-profile') {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F8F9FA' },
      }}
    />
  );
}
