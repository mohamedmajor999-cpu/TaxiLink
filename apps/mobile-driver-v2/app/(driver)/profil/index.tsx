import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { authService, driverService, reportError } from '@taxilink/services';

import { Icon } from '@/components/icons/Icon';
import { SideBarDrawer } from '@/components/navigation/SideBarDrawer';
import { useDriverDrawer } from '@/components/navigation/useDriverDrawer';
import { ProfileHeroCard } from '@/components/profil/ProfileHeroCard';
import { ProfileSectionApp } from '@/components/profil/ProfileSectionApp';
import { ProfileSectionCompte } from '@/components/profil/ProfileSectionCompte';
import { ProfileSectionRGPD } from '@/components/profil/ProfileSectionRGPD';
import { ProfileStatsTiles } from '@/components/profil/ProfileStatsTiles';
import { useAuth } from '@/hooks/useAuth';
import { useDriverProfilScreen } from '@/components/profil/useDriverProfilScreen';
import { useTheme } from '@/lib/theme';

export default function ProfilScreen() {
  const { user } = useAuth();
  const profil = useDriverProfilScreen(user?.id ?? null, user?.email ?? null);
  const drawer = useDriverDrawer('profil');
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
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header : hamburger (drawer) + dot rouge si offline + titre */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.bg,
        }}
      >
        <Pressable
          onPress={() => drawer.setOpen(true)}
          accessibilityLabel="Ouvrir le menu"
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="menu" size={20} color={colors.ink} strokeWidth={2.2} />
          {!drawer.isOnline && (
            <View
              style={{
                position: 'absolute',
                top: 7,
                right: 8,
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: colors.danger,
                borderWidth: 1.5,
                borderColor: colors.bg,
              }}
            />
          )}
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.ink, marginLeft: 4 }}>
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
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
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

      <SideBarDrawer
        open={drawer.open}
        onClose={() => drawer.setOpen(false)}
        activeTab="profil"
        onTabChange={drawer.handleTabChange}
        onPostCourse={drawer.handlePostCourse}
        onSignOut={drawer.handleSignOut}
        name={drawer.name}
        initials={drawer.initials}
        groupName={drawer.primaryGroup}
        isOnline={drawer.isOnline}
        coursesBadge={0}
      />
    </SafeAreaView>
  );
}
