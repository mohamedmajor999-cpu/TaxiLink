import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Mapbox, { Camera, MapView, MarkerView } from '@rnmapbox/maps';
import { useGpsStore } from '@taxilink/stores';

import { useTheme } from '@/lib/theme';

// Token deja set globalement par MissionMapMapbox au boot. On le re-applique
// ici en defensive : si l'utilisateur arrive sur la course active sans avoir
// ouvert la home d'abord (deep link), Mapbox.setAccessToken garantit que la
// carte rend bien.
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? null);

interface Props {
  /** Destination active (pickup ou drop selon la phase). Pin rouge. */
  destLat: number;
  destLng: number;
}

// Carte Mapbox natif dediee a l'ecran active : 1 pin destination rouge +
// 1 pin position chauffeur bleu mis a jour en live via useGpsStore.
// Auto-fit pour garder les 2 pins visibles. Style 2D plat (pas de pitch),
// compass/rotation desactives — l'objectif est juste de visualiser la
// progression vers la destination, pas d'explorer la carte.
//
// Remplace l'ancienne implementation WebView Leaflet (2026-05-20) : evite
// d'embarquer Leaflet + son CSS via CDN dans une WebView, gagne en perf et
// en coherence visuelle avec la home (meme moteur Mapbox).
export function ActiveMissionMap({ destLat, destLng }: Props) {
  const { isDark } = useTheme();
  const cameraRef = useRef<Camera>(null);
  const coords = useGpsStore((s) => s.coords);

  // Style Mapbox suit le mode nuit Tesla. En dark on utilise navigation-night-v1
  // (GPS de voiture la nuit) au lieu de dark-v11 quasi-noir, plus lisible.
  const styleURL = useMemo<string>(
    () => (isDark ? 'mapbox://styles/mapbox/navigation-night-v1' : Mapbox.StyleURL.Street),
    [isDark],
  );

  // Auto-fit camera : montre les 2 pins (driver + dest) avec padding.
  // Recalcule a chaque update GPS. Sans coords, on cale sur la dest seule.
  useEffect(() => {
    if (!cameraRef.current) return;
    if (!coords) {
      cameraRef.current.setCamera({
        centerCoordinate: [destLng, destLat],
        zoomLevel: 14,
        animationDuration: 400,
      });
      return;
    }
    // fitBounds : sw + ne en [lng, lat]. Mapbox calcule le zoom max pour les
    // inclure tous deux + padding.
    const sw: [number, number] = [Math.min(coords.lng, destLng), Math.min(coords.lat, destLat)];
    const ne: [number, number] = [Math.max(coords.lng, destLng), Math.max(coords.lat, destLat)];
    cameraRef.current.fitBounds(ne, sw, [80, 80, 80, 80], 400);
  }, [coords?.lat, coords?.lng, destLat, destLng]);

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        styleURL={styleURL}
        scaleBarEnabled={false}
        attributionEnabled={false}
        logoEnabled={false}
        compassEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [destLng, destLat],
            zoomLevel: 14,
          }}
        />

        {/* Pin destination rouge (anchor bas pour que la pointe touche le point exact). */}
        <MarkerView coordinate={[destLng, destLat]} anchor={{ x: 0.5, y: 1 }}>
          <DestPin />
        </MarkerView>

        {/* Pin driver bleu en live (anchor centre). */}
        {coords && (
          <MarkerView coordinate={[coords.lng, coords.lat]} anchor={{ x: 0.5, y: 0.5 }}>
            <DriverDot />
          </MarkerView>
        )}
      </MapView>
    </View>
  );
}

function DestPin() {
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
        borderBottomLeftRadius: 14,
        borderBottomRightRadius: 0,
        backgroundColor: '#DC2626',
        borderWidth: 3,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate: '-45deg' }],
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 5,
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: '#FFFFFF',
        }}
      />
    </View>
  );
}

function DriverDot() {
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(37,99,235,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: '#2563EB',
          borderWidth: 2,
          borderColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 1 },
          elevation: 3,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1c1c1c' },
});
