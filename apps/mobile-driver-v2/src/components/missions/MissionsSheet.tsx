import { forwardRef, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetFooter,
  type BottomSheetFooterProps,
  type BottomSheetHandleProps,
} from '@gorhom/bottom-sheet';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Mission } from '@taxilink/supabase-types';

import { DriverHomeFilterChips, type HomeTypeFilter } from './DriverHomeFilterChips';
import { MissionSheetItem } from './MissionSheetItem';
import { useTheme } from '@/lib/theme';

// 1er snap : valeur fixe en px (pas %) pour que la position du sheet replié
// soit stable entre light/dark — sinon NavigationBar.setBackgroundColorAsync
// du toggle nuit peut faire varier useWindowDimensions().height de quelques
// dizaines de px et décaler le sheet vers le bas en mode nuit.
// Les snaps suivants restent en %.
export const COLLAPSED_SHEET_HEIGHT = 55;

interface FilterProps {
  filter: HomeTypeFilter;
  counts: Record<HomeTypeFilter, number>;
  urgentOnly: boolean;
  nearbyOnly: boolean;
  hasUserCoords: boolean;
  onFilterChange: (key: HomeTypeFilter) => void;
  onUrgentToggle: () => void;
  onNearbyToggle: () => void;
}

interface Props {
  missions: Mission[];
  /** Total avant filtres chips (type/urgent/nearby). Permet d'afficher "6 / 11"
   * quand des filtres masquent une partie — sinon l'utilisateur croit que des
   * annonces ont disparu alors qu'elles sont juste filtrées. */
  totalCount?: number;
  selectedId: string | null;
  scopeLabel?: string;
  userCoords: { lat: number; lng: number } | null;
  footer?: ReactNode;
  onSelect?: (id: string) => void;
  onChange?: (index: number) => void;
  filterProps?: FilterProps;
}

export const MissionsSheet = forwardRef<BottomSheet, Props>(
  ({ missions, totalCount, selectedId, scopeLabel, userCoords, footer, onSelect, onChange, filterProps }, ref) => {
    const { colors } = useTheme();
    const { height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    // Container layout FIGÉ au 1er render. C'est la seule façon que j'ai
    // trouvée pour empêcher le sheet de bouger au toggle thème : si height
    // OU insets.bottom varient subtilement (StatusBar style="auto", re-render
    // ThemeProvider, ré-init Expo Go natif…), gorhom recalcule la position
    // pixel du sheet (ancré au bottom = height - offset.bottom). En figeant,
    // le sheet ne peut plus bouger sauf via snapToIndex explicite.
    // Trade-off : rotation device ne re-positionne pas correctement le sheet
    // tant que l'écran n'est pas démonté/remonté — acceptable pour cette app.
    const frozenLayoutRef = useRef({ height, bottomInset: insets.bottom });
    const containerLayoutState = useSharedValue({
      height: frozenLayoutRef.current.height,
      offset: { top: 0, bottom: frozenLayoutRef.current.bottomInset, right: 0, left: 0 },
    });

    // Snap max 92% (plutôt que 80%) pour que la FlatList ait assez de hauteur
    // pour scroller jusqu'au dernier item. À 80% avec footer Accepter/Détail
    // (~95px), handle + header + chips, il restait <50% de l'écran pour la
    // liste — les dernières annonces étaient inaccessibles. Le topInset garde
    // la status bar visible et empêche le sheet de glisser sous le notch.
    const snapPoints = useMemo(
      () => [COLLAPSED_SHEET_HEIGHT, '40%', '65%', '92%'],
      [],
    );

    const renderItem = useCallback(
      ({ item }: { item: Mission }) => (
        <MissionSheetItem
          mission={item}
          selected={item.id === selectedId}
          userCoords={userCoords}
          onSelect={onSelect}
        />
      ),
      [selectedId, userCoords, onSelect],
    );

    // Header de la FlatList : titre + count + chips de filtre. MUST go via
    // ListHeaderComponent (et non comme Views sœurs avant la FlatList), sinon
    // gorhom ne capte pas les gestes de scroll sur la liste — c'est la règle
    // « scrollable component MUST be direct child of BottomSheet » de gorhom v5.
    // Bug observé : user pouvait scroller un peu mais la liste se bloquait avant
    // d'atteindre le dernier item, parce que le système de mesure interne du
    // sheet ne savait pas où finissait son contenu scrollable.
    const ListHeader = useMemo(
      () => (
        <>
          <View style={{ paddingHorizontal: 20, paddingBottom: 8, alignItems: 'center', gap: 2 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.ink }}>Annonces autour de vous</Text>
            <Text style={{ fontSize: 13, color: colors.inkSoft, fontWeight: '600' }}>
              {totalCount != null && totalCount !== missions.length
                ? `${missions.length} / ${totalCount}`
                : missions.length}
              {scopeLabel ? ` · ${scopeLabel}` : ''}
            </Text>
          </View>
          {filterProps && (
            <View style={{ paddingBottom: 10 }}>
              <DriverHomeFilterChips {...filterProps} />
            </View>
          )}
        </>
      ),
      [colors.ink, colors.inkSoft, totalCount, missions.length, scopeLabel, filterProps],
    );

    const ListEmpty = useMemo(
      () => (
        <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: colors.ink, marginBottom: 4 }}>
            Aucune annonce autour de vous
          </Text>
          <Text style={{ fontSize: 12.5, color: colors.inkSoft, textAlign: 'center' }}>
            Aucune course ne correspond à vos filtres pour le moment.
          </Text>
        </View>
      ),
      [colors.ink, colors.inkSoft],
    );

    // Footer flottant gorhom : reste collé en bas du sheet quelle que soit la
    // taille de la FlatList. Sans ça, un footer en fin de flow se retrouve
    // poussé hors-écran quand le sheet n'est pas assez grand.
    const renderFooter = useCallback(
      (props: BottomSheetFooterProps) =>
        footer ? (
          <BottomSheetFooter {...props} bottomInset={0}>
            <View
              style={{
                paddingHorizontal: 16,
                paddingTop: 10,
                paddingBottom: 16,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              {footer}
            </View>
          </BottomSheetFooter>
        ) : null,
      [footer, colors.border, colors.surface],
    );

    return (
      <BottomSheet
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        // topInset = status bar : empêche le snap max (92%) de glisser sous
        // le notch ou la barre d'état Android.
        topInset={insets.top}
        // bottomInset = 10 : remonte le sheet de 10px par rapport au bas pour
        // ne pas etre cache par la nav bar gestuelle Android (Pixel/Samsung
        // recents). Cleaire ET sombre, tous les devices.
        bottomInset={10}
        handleComponent={SheetHandle}
        backgroundStyle={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        enablePanDownToClose={false}
        // Pas d'animation slide-up au mount : sinon la carte est visible
        // ~300ms avant que le sheet finisse de monter du bas → effet de lag.
        // Le sheet apparaît directement à sa position initiale (1er snap).
        animateOnMount={false}
        // Bypass de la mesure onLayout interne (gorhom v5.2+) : on fournit
        // l'état de layout du container directement via SharedValue pour
        // éviter l'attente d'une frame supplémentaire — sinon la carte
        // (WebView, peinte immédiatement) est visible avant le sheet.
        containerLayoutState={containerLayoutState}
        onChange={onChange}
        footerComponent={footer ? renderFooter : undefined}
      >
        <BottomSheetFlatList
          data={missions}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={{
            paddingHorizontal: 11,
            // ~95px = hauteur du footer flottant (52 bouton + 10 + 16 + 1 border + ~16 marge)
            // pour que le dernier item ne soit pas caché derrière la barre Accepter/Détail
            paddingBottom: footer ? 95 : 24,
            gap: 14,
          }}
          showsVerticalScrollIndicator={false}
        />
      </BottomSheet>
    );
  },
);

MissionsSheet.displayName = 'MissionsSheet';

function SheetHandle(_props: BottomSheetHandleProps) {
  const { colors } = useTheme();
  return (
    <View style={{ height: 32, alignItems: 'center', justifyContent: 'center', paddingTop: 10 }}>
      <View style={{ width: 56, height: 5, borderRadius: 999, backgroundColor: colors.border }} />
    </View>
  );
}
