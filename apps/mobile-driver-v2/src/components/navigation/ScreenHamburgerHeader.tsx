import { useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { SideBarDrawer, type DrawerTab } from '@/components/navigation/SideBarDrawer';
import { useDrawerData } from '@/hooks/useDrawerData';
import { useTheme } from '@/lib/theme';

interface Props {
  /** Onglet actif à mettre en évidence dans le drawer (par défaut : aucun = 'carte') */
  activeTab?: DrawerTab;
  /** Titre optionnel affiché entre le hamburger et le slot droit */
  title?: string;
  /** Bouton(s) optionnel(s) à droite du titre (ex: bouton Inviter) */
  rightSlot?: ReactNode;
}

// Header réutilisable avec hamburger fonctionnel à gauche : un tap ouvre le
// SideBarDrawer global (Carte / Mes courses / Groupes / Mon profil + bouton
// Poster une course + Se déconnecter). Évite la duplication du fetch profil
// et des handlers dans chaque écran (cf. useDrawerData).
export function ScreenHamburgerHeader({ activeTab = 'carte', title, rightSlot }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawer = useDrawerData();
  const { colors, isDark } = useTheme();

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <View style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden' }}>
          <Pressable
            onPress={() => setDrawerOpen(true)}
            android_ripple={{ color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}
            accessibilityLabel="Ouvrir le menu"
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="menu" size={20} color={colors.ink} strokeWidth={2.2} />
          </Pressable>
        </View>
        {title && (
          <Text
            numberOfLines={1}
            style={{ flex: 1, fontSize: 17, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 }}
          >
            {title}
          </Text>
        )}
        {!title && <View style={{ flex: 1 }} />}
        {rightSlot}
      </View>

      <SideBarDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setDrawerOpen(false);
          drawer.handleTabChange(tab);
        }}
        onPostCourse={() => {
          setDrawerOpen(false);
          drawer.handlePostCourse();
        }}
        onSignOut={drawer.handleSignOut}
        name={drawer.name}
        initials={drawer.initials}
        groupName={drawer.primaryGroup}
        isOnline={drawer.isOnline}
      />
    </>
  );
}
