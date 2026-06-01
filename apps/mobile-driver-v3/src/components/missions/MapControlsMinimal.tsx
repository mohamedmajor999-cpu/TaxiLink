import { Pressable, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

interface Props {
  rightBottom: number;
  onLocate: () => void;
  onFullscreen: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggle3D: () => void;
  onToggleSatellite: () => void;
  // En plein-ecran : on remplace l'icone fullscreen par "minimize" (X).
  fullscreenActive: boolean;
  // True si la carte est actuellement en mode 3D (pitch > 0).
  is3D: boolean;
  // True si la carte est en mode satellite (Mapbox SatelliteStreet).
  isSatellite: boolean;
}

// Stack vertical de controles a droite de la carte. Layout :
//   [ + ] zoom in
//   [ - ] zoom out
//   [3D] toggle 3D (avec indicateur visuel quand actif + warning conso au tap)
//   [📍] me localiser
//   [⛶] plein ecran / X (en mode plein ecran)
//
// Le toggle 3D est compact (32px) pour ne pas surcharger ; les autres
// boutons font 44px (cible de tap confortable).
export function MapControlsMinimal({
  rightBottom,
  onLocate,
  onFullscreen,
  onZoomIn,
  onZoomOut,
  onToggle3D,
  onToggleSatellite,
  fullscreenActive,
  is3D,
  isSatellite,
}: Props) {
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        right: 14,
        bottom: rightBottom,
        alignItems: 'center',
        gap: 8,
      }}
    >
      <ButtonCircle icon="plus" onPress={onZoomIn} />
      <ButtonCircle icon="minus" onPress={onZoomOut} />
      <Toggle3DButton active={is3D} onPress={onToggle3D} />
      <ToggleSatelliteButton active={isSatellite} onPress={onToggleSatellite} />
      <ButtonCircle icon="locate" onPress={onLocate} />
      <ButtonCircle icon={fullscreenActive ? 'x' : 'fullscreen'} onPress={onFullscreen} />
    </View>
  );
}

function ButtonCircle({ icon, onPress }: { icon: IconName; onPress: () => void }) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.surfaceElevated,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: isDark ? 0.55 : 0.22,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 5 },
        elevation: 5,
        ...(isDark ? { borderWidth: 1, borderColor: colors.border } : null),
      }}
    >
      <Pressable
        onPress={onPress}
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderless: true }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon name={icon} size={20} color={colors.ink} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

// Bouton 3D distinct (label texte "3D" au lieu d'icone). Actif = fond jaune
// brand + ink fonce. Inactif = surface normale. Le warning conso est affiche
// par le parent (Alert au tap) pour ne pas dupliquer dans plusieurs composants.
// Bouton bascule streets <-> satellite. Meme design haute lisibilite que le
// bouton 3D : actif = fond inverse, icone monde. Demande user 2026-05-25.
function ToggleSatelliteButton({ active, onPress }: { active: boolean; onPress: () => void }) {
  const { colors, isDark } = useTheme();
  const activeBg = isDark ? '#FFFFFF' : '#0A0A0A';
  const activeIcon = isDark ? '#0A0A0A' : '#FFD11A';
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: active ? activeBg : colors.surfaceElevated,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: isDark ? 0.55 : 0.22,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 5 },
        elevation: 5,
        ...(isDark && !active ? { borderWidth: 1, borderColor: colors.border } : null),
      }}
    >
      <Pressable
        onPress={onPress}
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderless: true }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon name="globe" size={20} color={active ? activeIcon : colors.ink} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

function Toggle3DButton({ active, onPress }: { active: boolean; onPress: () => void }) {
  const { colors, isDark } = useTheme();
  // Design HAUTE LISIBILITE (refonte definitive 2026-05-25) :
  // - Inactif : fond surface neutre + texte ink.
  // - Actif en LIGHT : fond noir + texte JAUNE (signal brand iconique).
  // - Actif en DARK : fond BLANC + texte NOIR (contraste max, plus jamais de
  //   bleu sur bleu sur OLED qui rendait le 3D invisible). Couleurs hardcodees
  //   pour eviter toute regression liee a la propagation du theme via Context.
  const activeBg = isDark ? '#FFFFFF' : '#0A0A0A';
  const activeText = isDark ? '#0A0A0A' : '#FFD11A';
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: active ? activeBg : colors.surfaceElevated,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: isDark ? 0.55 : 0.22,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 5 },
        elevation: 5,
        ...(isDark && !active ? { borderWidth: 1, borderColor: colors.border } : null),
      }}
    >
      <Pressable
        onPress={onPress}
        android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: true }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: '900',
            color: active ? activeText : colors.ink,
            letterSpacing: -0.3,
          }}
        >
          3D
        </Text>
      </Pressable>
    </View>
  );
}
