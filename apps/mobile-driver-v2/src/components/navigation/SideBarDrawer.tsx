import { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

export type DrawerTab = 'carte' | 'courses' | 'groupes' | 'profil';

interface Props {
  open: boolean;
  onClose: () => void;
  activeTab: DrawerTab;
  onTabChange: (tab: DrawerTab) => void;
  onPostCourse: () => void;
  onSignOut: () => void;
  name: string;
  initials: string;
  groupName?: string | null;
  isOnline: boolean;
  coursesBadge?: number;
}

interface NavItem {
  key: DrawerTab;
  label: string;
  icon: IconName;
}

const ITEMS_BEFORE_POST: NavItem[] = [
  { key: 'carte', label: 'Carte', icon: 'home' },
  { key: 'courses', label: 'Mes courses', icon: 'list' },
];
const ITEMS_AFTER_POST: NavItem[] = [
  { key: 'groupes', label: 'Groupes', icon: 'users' },
  { key: 'profil', label: 'Mon profil', icon: 'user' },
];

export function SideBarDrawer({
  open,
  onClose,
  activeTab,
  onTabChange,
  onPostCourse,
  onSignOut,
  name,
  initials,
  groupName,
  isOnline,
  coursesBadge,
}: Props) {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const drawerWidth = Math.min(320, width * 0.82);
  const translateX = useRef(new Animated.Value(-drawerWidth)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: open ? 0 : -drawerWidth,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: open ? 1 : 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [open, drawerWidth, translateX, backdropOpacity]);

  const handleNav = (tab: DrawerTab) => {
    onTabChange(tab);
    onClose();
  };
  const handlePost = () => {
    onPostCourse();
    onClose();
  };

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <Animated.View
          pointerEvents={open ? 'auto' : 'none'}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            opacity: backdropOpacity,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Fermer le menu" />
        </Animated.View>

        <Animated.View
          style={{
            position: 'absolute',
            top: 0, bottom: 0, left: 0,
            width: drawerWidth,
            backgroundColor: colors.surface,
            transform: [{ translateX }],
            shadowColor: '#000',
            shadowOpacity: isDark ? 0.55 : 0.18,
            shadowRadius: 24,
            shadowOffset: { width: 8, height: 0 },
            elevation: 16,
          }}
        >
          <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
            {/* Header : avatar + nom + statut + close — paddings PWA px-5 pt-5 pb-4 */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Pressable
                onPress={() => handleNav('profil')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}
                accessibilityLabel="Ouvrir mon profil"
              >
                <View
                  style={{
                    width: 48, height: 48, borderRadius: 24,
                    // L'avatar reste noir dans les 2 modes : il porte le brand jaune en initiales,
                    // pas une CTA. Garder noir = identité visuelle constante (cf. règle "pill noire").
                    backgroundColor: '#000000',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: colors.brand, fontSize: 16, fontWeight: '800' }}>{initials}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>
                    {name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <View
                      style={{
                        width: 7, height: 7, borderRadius: 3.5,
                        backgroundColor: isOnline ? colors.brand : colors.inkSoft,
                      }}
                    />
                    <Text numberOfLines={1} style={{ fontSize: 12, color: colors.inkSoft, fontWeight: '500' }}>
                      {groupName ? `${groupName} · ` : ''}
                      {isOnline ? 'En ligne' : 'Hors ligne'}
                    </Text>
                  </View>
                </View>
              </Pressable>
              <Pressable
                onPress={onClose}
                accessibilityLabel="Fermer le menu"
                style={{
                  width: 36, height: 36, borderRadius: 18,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon name="x" size={20} color={colors.ink} strokeWidth={2} />
              </Pressable>
            </View>

            {/* Nav items */}
            <View style={{ flex: 1, paddingHorizontal: 12, paddingTop: 12, gap: 4 }}>
              {ITEMS_BEFORE_POST.map((item) => (
                <DrawerNavItem
                  key={item.key}
                  item={item}
                  active={activeTab === item.key}
                  badge={item.key === 'courses' ? coursesBadge : undefined}
                  onPress={() => handleNav(item.key)}
                />
              ))}

              {/* Poster une course : View visuel + Pressable interne (pattern fiable Android RN) */}
              <View
                style={{
                  borderRadius: 12,
                  // CTA principale : noir en light, accent bleu Tesla en dark (cf. règle CTA).
                  backgroundColor: isDark ? colors.accent : '#000000',
                  marginTop: 4,
                  marginBottom: 4,
                  overflow: 'hidden',
                }}
              >
                <Pressable
                  onPress={handlePost}
                  accessibilityLabel="Poster une course"
                  android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                  }}
                >
                  <Icon name="plus" size={20} color="#FFFFFF" strokeWidth={2.4} />
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>Poster une course</Text>
                </Pressable>
              </View>

              {ITEMS_AFTER_POST.map((item) => (
                <DrawerNavItem
                  key={item.key}
                  item={item}
                  active={activeTab === item.key}
                  onPress={() => handleNav(item.key)}
                />
              ))}
            </View>

            {/* Bottom : Se déconnecter — wrapper View visuel + Pressable interne */}
            <View style={{ borderTopWidth: 1, borderTopColor: colors.border, padding: 12 }}>
              <View
                style={{
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: colors.surfaceMuted,
                  overflow: 'hidden',
                }}
              >
                <Pressable
                  onPress={onSignOut}
                  accessibilityLabel="Se déconnecter"
                  android_ripple={{ color: 'rgba(163,45,45,0.10)' }}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Icon name="logout" size={16} color={colors.danger} strokeWidth={2} />
                  <Text style={{ color: colors.danger, fontSize: 14, fontWeight: '600' }}>Se déconnecter</Text>
                </Pressable>
              </View>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function DrawerNavItem({
  item,
  active,
  badge,
  onPress,
}: {
  item: NavItem;
  active: boolean;
  badge?: number;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const hasBadge = badge !== undefined && badge > 0;
  return (
    <View
      style={{
        position: 'relative',
        borderRadius: 12,
        backgroundColor: active ? colors.surfaceMuted : 'transparent',
        overflow: 'hidden',
      }}
    >
      {/* Barre jaune active en sibling du Pressable (pas clippée par les coins arrondis car centrée verticalement et étroite) */}
      {active && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            marginTop: -12,
            width: 4,
            height: 24,
            borderTopRightRadius: 2,
            borderBottomRightRadius: 2,
            backgroundColor: colors.brand,
            zIndex: 1,
          }}
        />
      )}
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      android_ripple={{ color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
      }}
    >
      <Icon name={item.icon} size={20} color={active ? colors.ink : colors.inkMuted} strokeWidth={active ? 2 : 1.7} />
      <Text
        style={{
          flex: 1,
          fontSize: 15,
          fontWeight: '500', // PWA: font-medium pour actif ET inactif (le changement est sur la couleur + bg, pas le poids)
          color: active ? colors.ink : colors.inkMuted,
        }}
      >
        {item.label}
      </Text>
      {hasBadge && (
        <View
          style={{
            minWidth: 22, height: 22, paddingHorizontal: 7, borderRadius: 11,
            backgroundColor: colors.brand,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#0F0F0F' }}>{badge}</Text>
        </View>
      )}
    </Pressable>
    </View>
  );
}
