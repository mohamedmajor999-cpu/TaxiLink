import { Redirect } from 'expo-router';

import { OnboardingPage } from '@/components/onboarding/OnboardingPage';
import { useAuth } from '@/hooks/useAuth';

export default function Onboarding() {
  const { user, loading } = useAuth();
  // Cold start direct sur /onboarding alors que l'user est déjà loggé
  // (cas rare : reinstall sans clear AsyncStorage côté supabase token).
  if (!loading && user) return <Redirect href="/" />;
  return <OnboardingPage />;
}
