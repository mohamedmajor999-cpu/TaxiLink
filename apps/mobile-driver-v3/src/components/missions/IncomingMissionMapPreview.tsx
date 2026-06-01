import { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { useTheme } from '@/lib/theme';

interface Props {
  pickup:      { lat: number; lng: number };
  destination: { lat: number; lng: number };
  // Hauteur fixe — par defaut 180px pour un preview qui montre le contexte
  // sans manger la moitie du popup. Overridable.
  height?: number;
}

// Preview de la route pickup → destination dans le modal "Nouvelle annonce".
//
// HISTORIQUE — avant 2026-05-23, on montait ici une 2e MapView @rnmapbox/maps
// par-dessus celle de la home (Carte). Sur Android + New Architecture, avoir
// 2 contextes EGL Mapbox simultanes crashait le process natif (signal SEGV
// dans le SDK Mapbox GL). Rapporte par un user 2026-05-23 : "lorsque une
// notification d'une nouvelle annonce aller paraitre l'application s'est ferme".
//
// FIX — on remplace par l'API Mapbox Static Images (PNG cote serveur Mapbox,
// telecharge ici en simple <Image>). Pas de GL context client → pas de crash.
// Trade-off : l'image est statique (pas de pan/zoom), mais pour un preview
// dans un modal de 20s c'est exactement ce qu'on veut.
export const IncomingMissionMapPreview = memo(function IncomingMissionMapPreview({
  pickup,
  destination,
  height = 180,
}: Props) {
  const { isDark } = useTheme();
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

  // Style cote serveur Mapbox. navigation-day/night pour rester coherent avec
  // la palette de la MissionMapMapbox dynamique.
  const style = isDark ? 'navigation-night-v1' : 'navigation-day-v1';

  // 2 pins overlay : "a" pickup vert, "b" destination noir. `auto` demande au
  // serveur de framer automatiquement les pins avec un padding raisonnable.
  // 600x360@2x = retina sur ecran ~360px de large × 180 de haut.
  const pickupPin = `pin-s-a+22c55e(${pickup.lng},${pickup.lat})`;
  const dropoffPin = `pin-s-b+0a0a0b(${destination.lng},${destination.lat})`;
  const overlay = `${pickupPin},${dropoffPin}`;

  const uri = token
    ? `https://api.mapbox.com/styles/v1/mapbox/${style}/static/${overlay}/auto/600x360@2x?access_token=${token}`
    : null;

  return (
    <View style={[styles.container, { height }]}>
      {uri && (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#E8E0D0',
    overflow: 'hidden',
  },
});
