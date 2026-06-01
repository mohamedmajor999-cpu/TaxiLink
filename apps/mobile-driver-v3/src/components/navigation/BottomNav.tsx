import { Pressable, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';
import { useMapFullscreenStore } from '@/lib/mapFullscreenStore';

type Tab = { key: string; label: string; icon: IconName; route: string };

const TABS: Tab[] = [
  { key: 'carte', label: 'Carte', icon: 'home', route: '/' },
  { key: 'courses', label: 'Courses', icon: 'list', route: '/courses' },
  { key: 'groupes', label: 'Groupes', icon: 'users', route: '/groupes' },
  { key: 'profil', label: 'Profil', icon: 'user', route: '/profil' },
];

// Routes plein ecran sur lesquelles le bottom nav DOIT etre cache :
// navigation mission active (flow course en cours, CTA Naviguer critique).
// Le slash final sur '/group/' evite de masquer la LISTE '/groupes' tout en
// masquant les details '/group/[id]'. Poster-course et profil gardent la nav.
const HIDDEN_PATHS = ['/mission', '/group/', '/login', '/register'];

export function BottomNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const mapFullscreen = useMapFullscreenStore((s) => s.fullscreen);

  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null;
  // Plein-ecran carte d'accueil : la nav doit disparaitre totalement, la carte
  // prend tout l'ecran. cf. useMapFullscreenStore.
  if (mapFullscreen) return null;

  const active = matchActiveTab(pathname);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        // Hauteur fixe : 64px nav + insets bas (gesture bar Android / home indicator iOS).
        height: 64 + insets.bottom,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingBottom: insets.bottom,
        flexDirection: 'row',
        alignItems: 'center',
        // zIndex eleve pour passer par-dessus le Stack Expo Router (pattern utilise
        // dans InAppNotificationBanner). Sans ca, le Stack rend ses ecrans pleins
        // ecran qui recouvrent les siblings du layout.
        zIndex: 9999,
        // Ombre vers le haut pour mieux detacher de l'ecran courant.
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 12,
      }}
    >
      {TABS.slice(0, 2).map((tab) => (
        <TabItem key={tab.key} tab={tab} active={active === tab.key} colors={colors} />
      ))}

      {/* Slot vide central : laisse passer le FAB qui se positionne en absolute */}
      <View style={{ width: 64 }} pointerEvents="none" />

      {TABS.slice(2).map((tab) => (
        <TabItem key={tab.key} tab={tab} active={active === tab.key} colors={colors} />
      ))}

      {/* FAB jaune Poster, depasse au-dessus de la nav */}
      <FabPoster colors={colors} isDark={isDark} insetsBottom={insets.bottom} />
    </View>
  );
}

function TabItem({
  tab,
  active,
  colors,
}: {
  tab: Tab;
  active: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <Pressable
      // router.navigate (vs push) : remonte vers l'instance existante du tab
      // si elle est deja dans le stack. Sinon ca empilait une nouvelle Mapbox
      // a chaque retour vers Carte → 3-4 cartes montees en RAM → freeze + chauffe.
      onPress={() => router.navigate(tab.route as never)}
      android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: true }}
      style={{
        flex: 1,
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
      }}
    >
      {/* Tab actif : icone avec trait NOIR + INTERIEUR JAUNE (fill SVG).
          Tab inactif : trait gris, pas de fill. Pas de pill autour. */}
      <Icon
        name={tab.icon}
        size={24}
        color={active ? '#0F0F0F' : colors.inkSoft}
        strokeWidth={active ? 2.4 : 2}
        fill={active ? colors.brand : 'none'}
      />
      <Text
        style={{
          fontSize: 10.5,
          fontWeight: '700',
          color: active ? colors.ink : colors.inkSoft,
          letterSpacing: -0.1,
        }}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
}

function FabPoster({
  colors,
  isDark,
  insetsBottom,
}: {
  colors: ReturnType<typeof useTheme>['colors'];
  isDark: boolean;
  insetsBottom: number;
}) {
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        // Le FAB depasse au-dessus de la nav : -22px = remontee de la moitie
        bottom: insetsBottom + 18,
        alignItems: 'center',
      }}
    >
      <Pressable
        onPress={() => router.push('/poster-course')}
        android_ripple={{ color: 'rgba(0,0,0,0.15)', borderless: true }}
        style={{
          width: 60,
          height: 60,
          borderRadius: 20,
          backgroundColor: colors.brand,
          alignItems: 'center',
          justifyContent: 'center',
          // Anneau blanc/sombre autour du FAB pour bien le detacher de la barre.
          borderWidth: 4,
          borderColor: isDark ? colors.bg : '#FFFFFF',
          // Ombre brand pour bien le faire ressortir.
          shadowColor: colors.brand,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.45,
          shadowRadius: 14,
          elevation: 8,
        }}
      >
        <Icon name="plus" size={28} color={colors.brandInk} strokeWidth={3} />
      </Pressable>
    </View>
  );
}

// L'index `/` matche `(driver)/index.tsx`. Les autres sont directs.
// `usePathname()` retourne `/`, `/courses`, `/groupes`, `/profil` avec les groups Expo Router (parentheses ignorees).
function matchActiveTab(pathname: string): string {
  if (pathname === '/' || pathname === '') return 'carte';
  if (pathname.startsWith('/courses')) return 'courses';
  if (pathname.startsWith('/groupes')) return 'groupes';
  if (pathname.startsWith('/profil')) return 'profil';
  return '';
}
