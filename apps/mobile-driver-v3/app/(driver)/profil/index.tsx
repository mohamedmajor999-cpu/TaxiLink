import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { authService, driverService, reportError } from '@taxilink/services';

import { ProfileHeroCard } from '@/components/profil/ProfileHeroCard';
import { ProfileSectionApp } from '@/components/profil/ProfileSectionApp';
import { ProfileSectionCompte } from '@/components/profil/ProfileSectionCompte';
import { ProfileSectionRGPD } from '@/components/profil/ProfileSectionRGPD';
import { ProfileStatsTiles } from '@/components/profil/ProfileStatsTiles';
import { useAuth } from '@/hooks/useAuth';
import { useDriverProfilScreen } from '@/components/profil/useDriverProfilScreen';
import { useTheme } from '@/lib/theme';

// V7 : hamburger supprime. La BottomNav globale gere la navigation entre
// sections. La page profil affiche juste son contenu + titre.
export default function ProfilScreen() {
  const { user } = useAuth();
  const profil = useDriverProfilScreen(user?.id ?? null, user?.email ?? null);
  const { colors } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);

  function handleLogout() {
    Alert.alert('Se déconnecter', 'Veux-tu vraiment te déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          if (user?.id) {
            await driverService.setOnline(user.id, false).catch((err) => {
              reportError(err, { tags: { context: 'profil.signOut.flipOffline' } });
            });
          }
          try {
            await authService.signOut();
          } catch (err) {
            reportError(err, { tags: { phase: 'profil.sign-out' } });
            Alert.alert('Erreur', 'Impossible de se déconnecter.');
            setLoggingOut(false);
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 12,
        }}
      >
        <Text style={{ fontSize: 26, fontWeight: '900', color: colors.ink, letterSpacing: -0.8 }}>
          Profil
        </Text>
      </View>

      {profil.loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        >
          <ProfileHeroCard
            fullName={profil.fullName}
            initials={profil.initials}
            licenseNumber={profil.proNumber}
            city={profil.city}
            mainDepartement={profil.mainDepartement}
            onEdit={() => router.push('/profil/personal-info')}
          />

          <ProfileStatsTiles revenue={profil.monthlyRevenue} courseCount={profil.courseCount} />

          <ProfileSectionCompte
            email={profil.email}
            phone={profil.phone}
            documentsWarning={profil.documentsWarning}
            departements={profil.departements}
            onOpenInfos={() => router.push('/profil/personal-info')}
            onOpenStats={() => router.push('/profil/stats')}
            onOpenHistory={() => router.push('/profil/historique')}
            onOpenDocuments={() => router.push('/profil/documents')}
            onOpenDepartements={() => router.push('/profil/departements')}
            onOpenBlocked={() => router.push('/profil/blocked')}
          />

          <ProfileSectionApp
            loggingOut={loggingOut}
            onOpenSupport={() => router.push('/profil/support')}
            onLogout={handleLogout}
          />

          <ProfileSectionRGPD />

          <Text
            style={{
              textAlign: 'center',
              fontSize: 11,
              color: colors.inkSoft,
              paddingTop: 8,
            }}
          >
            Version 1.0.0
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
