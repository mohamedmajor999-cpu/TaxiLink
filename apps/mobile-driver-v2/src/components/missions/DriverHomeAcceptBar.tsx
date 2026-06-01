import { ActivityIndicator, Animated, Pressable, Text, View } from 'react-native';

import { useHoldAccept } from '@/hooks/useHoldAccept';
import { useTheme } from '@/lib/theme';

interface Props {
  selected: boolean;
  accepting: boolean;
  onAccept: () => void | Promise<void>;
  onShowDetail: () => void;
  emptyLabel?: string;
}

// Barre d'action en bas du sheet (footer). Affichée uniquement quand une mission est sélectionnée.
// - Accept (2/3) : capsule jaune dashed avec hold-to-confirm 1.25s (PWA HoldAcceptButton-faithful)
// - Détail (1/3) : rectangle blanc bordure grise → ouvre l'écran détail
export function DriverHomeAcceptBar({
  selected,
  accepting,
  onAccept,
  onShowDetail,
  emptyLabel = 'Sélectionnez une annonce',
}: Props) {
  const { colors, isDark } = useTheme();
  const hold = useHoldAccept({ onConfirm: onAccept, duration: 1250, disabled: accepting });
  const holdLabel =
    hold.state === 'confirmed' ? 'Course acceptée' : hold.state === 'pressing' ? 'Maintenez…' : 'Accepter la course';
  const fillWidth = hold.progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  if (!selected) {
    return (
      <View
        accessibilityRole="text"
        style={{
          height: 52,
          paddingHorizontal: 16,
          borderRadius: 16,
          backgroundColor: colors.surfaceElevated,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
        }}
      >
        <Text style={{ fontSize: 18 }}>✋</Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.inkSoft }}>{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {/* Accept — rectangle noir classique, hold-to-confirm 1.25s, texte blanc, sans icône.
          Bg noir fixe dans les 2 modes (design hold-to-confirm classique) — un bg bleu en
          dark faisait disparaître le fill jaune (mélange greenish-bleu). */}
      <View style={{ flex: 2, height: 52, borderRadius: 12, overflow: 'hidden' }}>
        <View
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: 12,
            backgroundColor: '#0F0F0F',
          }}
        />
        {/* Progress fill : barre jaune brand pleine opacité qui grossit pendant le hold.
            Couleur hardcodée #FFD11A pour garantir le rendu identique dans les 2 modes
            (un retour à colors.brand peut être impacté si le thème évolue). */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0, left: 0, bottom: 0,
            width: fillWidth,
            backgroundColor: '#FFD11A',
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 10,
          }}
        >
          {accepting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              numberOfLines={1}
              style={{ fontSize: 15, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3 }}
            >
              {holdLabel}
            </Text>
          )}
        </View>
        <Pressable
          onPressIn={hold.start}
          onPressOut={hold.cancel}
          disabled={accepting}
          accessibilityRole="button"
          accessibilityLabel="Maintenir pour accepter la course"
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            // backgroundColor:'transparent' explicite ET pas de borderRadius :
            // sur Android dark, un Pressable plein-cadre avec borderRadius sans
            // bg explicite récupère ?android:colorBackground du thème (sombre
            // opaque) qui recouvre le fill jaune. Le parent (ligne ~58) a déjà
            // overflow:hidden + borderRadius:12, donc inutile ici.
            backgroundColor: 'transparent',
          }}
        />
      </View>

      {/* Détail — wrapper View visuel + Pressable static (fiable Android) */}
      <View
        style={{
          flex: 1,
          height: 52,
          borderRadius: 12,
          backgroundColor: colors.surfaceElevated,
          borderWidth: 2,
          borderColor: colors.border,
          overflow: 'hidden',
        }}
      >
        <Pressable
          onPress={onShowDetail}
          accessibilityRole="button"
          accessibilityLabel="Voir le détail"
          android_ripple={{ color: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)' }}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '900', color: colors.ink, letterSpacing: -0.3 }}>
            Détail
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
