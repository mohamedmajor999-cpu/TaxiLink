import { forwardRef, memo, useImperativeHandle, useMemo, useRef, useState, useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Mapbox, { Camera, FillExtrusionLayer, MapView, MarkerView } from '@rnmapbox/maps';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

// Mapbox SDK natif. Token requis au boot ; sans token, la carte affiche un
// fond gris. Utilise EXPO_PUBLIC_MAPBOX_TOKEN deja present cote EAS env vars.
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? null);

export interface MapRegion {
  latitude: number;
  longitude: number;
  zoom?: number;
}

export interface MissionPin {
  id: string;
  lat: number;
  lng: number;
  priceLabel: string;
  medical: boolean;
  urgent: boolean;
  selected: boolean;
}

export type MapStyle = 'streets' | 'satellite';

export interface MissionMapHandle {
  panTo: (region: MapRegion) => void;
  setUserPosition: (coords: { latitude: number; longitude: number }) => void;
  setMissions: (pins: MissionPin[]) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setMapStyle: (style: MapStyle) => void;
  // Bascule pitch 0 / 50 + 3D buildings. Active = mode 3D (consomme +
  // batterie). Par defaut 2D plat au boot.
  set3D: (on: boolean) => void;
}

interface Props {
  onReady?: () => void;
  onSelectMission?: (id: string) => void;
  // Coords du driver depuis useGpsStore (alimente par expo-location).
  // On passe explicitement les coords au lieu de rendre <UserLocation /> de
  // Mapbox qui demandait son propre GPS et faisait clignoter l'icone locate
  // du systeme (2026-05-19). Maintenant : 1 seule source GPS = expo-location.
  userCoords?: { lat: number; lng: number } | null;
}

// Carte 3D Mapbox natif : pitch initial 50° pour le look "Bolt/Uber" avec
// batiments en relief (fill-extrusion inclus dans streets-v12). Replace le
// rendu Leaflet WebView qui ne supporte pas le pitch.
export const MissionMapMapbox = forwardRef<MissionMapHandle, Props>(
  ({ onReady, onSelectMission, userCoords }, ref) => {
    const { isDark } = useTheme();
    const cameraRef = useRef<Camera>(null);
    const [pins, setPins] = useState<MissionPin[]>([]);
    const [mapStyle, setMapStyleState] = useState<MapStyle>('streets');
    // Mode 3D : OFF par defaut (pitch 0, pas de 3D buildings) pour preserver la
    // batterie. Le user peut basculer via le bouton 3D sur la carte.
    const [is3D, setIs3DState] = useState(false);

    // Centre initial : si on a deja les coords du driver (rehydratees depuis le
    // store persistant useGpsStore au boot), on s'en sert immediatement pour
    // eviter le flash "pleine mer Afrique" (0,0 default Mapbox quand
    // defaultSettings ne s'applique pas a temps). Sinon, fallback sur le
    // barycentre des Bouches-du-Rhone (~entre Marseille et Aix), zoom 8.5 pour
    // englober TOUT le departement (Marseille → Aix → Salon → Arles).
    const initialCenter = useMemo<[number, number]>(
      () => (userCoords ? [userCoords.lng, userCoords.lat] : [5.30, 43.50]),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );

    // Style URL : `navigation-night-v1` (dark mode) au lieu de `dark-v11`.
    // dark-v11 etait quasi noir → user reportait carte peu lisible 2026-05-23.
    // navigation-night-v1 = standard GPS de voiture la nuit (sombre mais
    // contraste suffisant sur routes, labels et batiments).
    const styleURL = useMemo(() => {
      if (mapStyle === 'satellite') return Mapbox.StyleURL.SatelliteStreet;
      if (isDark) return 'mapbox://styles/mapbox/navigation-night-v1';
      return Mapbox.StyleURL.Street;
    }, [mapStyle, isDark]);

    useImperativeHandle(ref, () => ({
      panTo: ({ latitude, longitude, zoom }) => {
        cameraRef.current?.setCamera({
          centerCoordinate: [longitude, latitude],
          zoomLevel: zoom ?? 13,
          animationDuration: 600,
        });
      },
      setUserPosition: () => {
        // No-op : UserLocation gere le track natif via expo-location.
      },
      setMissions: (next) => setPins(next),
      zoomIn: () => {
        cameraRef.current?.zoomTo(15, 300);
      },
      zoomOut: () => {
        cameraRef.current?.zoomTo(10, 300);
      },
      setMapStyle: (s) => setMapStyleState(s),
      set3D: (on) => {
        setIs3DState(on);
        // Pitch a 50° (vue 3D Bolt/Uber) ou 0 (2D plat). Le 3D buildings est
        // rendu par <FillExtrusionLayer> conditionne sur is3D ci-dessous.
        cameraRef.current?.setCamera({
          pitch: on ? 50 : 0,
          animationDuration: 500,
        });
      },
    }));

    // Signal ready une fois monte (Mapbox onDidFinishLoadingStyle est sur MapView).
    useEffect(() => {
      const t = setTimeout(() => onReady?.(), 500);
      return () => clearTimeout(t);
    }, [onReady]);

    // Vol auto vers la position user des qu'elle arrive (1er fix GPS post-mount).
    // Garde-fou : on ne le fait qu'une fois (useRef flag), sinon chaque update
    // GPS replacerait la camera pendant que le user pan/zoom manuellement.
    // Zoom 11 = vue ~25km autour de la position : couvre le secteur de travail
    // sans noyer le user dans le departement entier.
    const flewToUserRef = useRef(false);
    useEffect(() => {
      if (flewToUserRef.current) return;
      if (!userCoords || !cameraRef.current) return;
      flewToUserRef.current = true;
      cameraRef.current.setCamera({
        centerCoordinate: [userCoords.lng, userCoords.lat],
        zoomLevel: 11,
        animationDuration: 800,
      });
    }, [userCoords]);

    return (
      <View style={styles.container}>
        <MapView
          style={StyleSheet.absoluteFill}
          styleURL={styleURL}
          scaleBarEnabled={false}
          attributionEnabled={Platform.OS === 'android'}
          logoEnabled={Platform.OS === 'android'}
          compassEnabled={false}
          pitchEnabled
          rotateEnabled
        >
          <Camera
            ref={cameraRef}
            defaultSettings={{
              centerCoordinate: initialCenter,
              // Zoom 8.5 = ~120km de large = couvre tout les Bouches-du-Rhone
              // (Marseille → Aix → Salon → Arles → La Ciotat).
              zoomLevel: 8.5,
              // Pitch 0 par defaut : 2D plat → drastiquement moins de polygones
              // a rasteriser, le GPU ne tourne plus a 60fps inutilement. Le
              // pitch 45 + 3D buildings reviendront quand on entrera en mode
              // "navigation course active" (a brancher quand on aura le toggle).
              // Mesures device : pitch+3D divisait l'autonomie /2 carte ouverte.
              pitch: 0,
              heading: 0,
            }}
          />

          {/* 3D buildings : actives UNIQUEMENT quand le user toggle le bouton 3D
              (par defaut off pour preserver la batterie). minZoomLevel=14 limite
              le rendu aux niveaux ou les extrusions sont visibles. */}
          {is3D && mapStyle !== 'satellite' && (
            <FillExtrusionLayer
              id="3d-buildings"
              sourceID="composite"
              sourceLayerID="building"
              minZoomLevel={14}
              maxZoomLevel={22}
              filter={['==', ['get', 'extrude'], 'true']}
              style={{
                fillExtrusionColor: isDark ? '#3a4150' : '#d0d0d0',
                fillExtrusionHeight: ['get', 'height'],
                fillExtrusionBase: ['get', 'min_height'],
                fillExtrusionOpacity: 0.75,
              }}
            />
          )}

          {/* Marker custom user position. Pas de <UserLocation /> Mapbox qui
              demande son propre GPS feed (cause du blink locate icon OS). */}
          {userCoords && (
            <MarkerView coordinate={[userCoords.lng, userCoords.lat]} anchor={{ x: 0.5, y: 0.5 }}>
              <UserDot />
            </MarkerView>
          )}

          {pins.map((pin) => (
            <MarkerView
              key={pin.id}
              coordinate={[pin.lng, pin.lat]}
              anchor={{ x: 0.5, y: 1 }}
            >
              <Pressable onPress={() => onSelectMission?.(pin.id)}>
                <PinView pin={pin} />
              </Pressable>
            </MarkerView>
          ))}
        </MapView>
      </View>
    );
  },
);

MissionMapMapbox.displayName = 'MissionMapMapbox';

// Dot bleu style Apple Maps : cercle plein + halo. Pas d'animation interne
// (pas de pulsation) — Reanimated dans un MarkerView coute cher sur Android.
function UserDot() {
  return (
    <View
      style={{
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: 'rgba(59,130,246,0.18)',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 14, height: 14, borderRadius: 7,
          backgroundColor: '#3B82F6',
          borderWidth: 2, borderColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
          elevation: 3,
        }}
      />
    </View>
  );
}

// Pin style aligne sur la PWA (cf. apps/web/.../missionMapPin.ts + globals.css) :
// - Pill blanc avec bord noir, prix en noir
// - Badge rond 18px a gauche : ROUGE pour CPAM (icone H hospital), BLEU pour
//   PRIVE (icone silhouette passager)
// - Selectionne : pill devient JAUNE brand
// - Urgent : petit cercle jaune en haut a droite
//
// React.memo : evite que les 20+ MarkerView re-rendent leurs children a chaque
// changement de `pins` array.
const PinView = memo(function PinView({ pin }: { pin: MissionPin }) {
  const selectedBg = '#FFD11A';
  const bg = pin.selected ? selectedBg : '#FFFFFF';
  const borderColor = '#1A1A1A';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingLeft: 4,
        paddingRight: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: bg,
        borderWidth: 2,
        borderColor,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
        transform: pin.selected ? [{ scale: 1.08 }] : undefined,
      }}
    >
      <PinBadge medical={pin.medical} selected={pin.selected} />
      <Text style={{ fontSize: 12, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.2 }}>
        {pin.priceLabel}
      </Text>
      {pin.urgent && (
        <View
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 11,
            height: 11,
            borderRadius: 6,
            backgroundColor: '#FFD11A',
            borderWidth: 1.5,
            borderColor: '#1A1A1A',
          }}
        />
      )}
    </View>
  );
});

// Badge rond a gauche du pill : CPAM = rouge medical avec H (hopital),
// PRIVE = bleu avec silhouette personne. Aligne PWA.
function PinBadge({ medical, selected }: { medical: boolean; selected: boolean }) {
  const bg = medical
    ? (selected ? '#FFFFFF' : '#DC2626')
    : (selected ? '#FFFFFF' : '#2563EB');
  const fg = medical
    ? (selected ? '#DC2626' : '#FFFFFF')
    : (selected ? '#2563EB' : '#FFFFFF');
  return (
    <View
      style={{
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {medical ? (
        // 'H' hospitalier sur fond rouge (signaletique hospitaliere francaise).
        <Text style={{ fontSize: 11, fontWeight: '900', color: fg, lineHeight: 12 }}>H</Text>
      ) : (
        // Silhouette personne sur fond bleu (passager).
        <Icon name="user" size={11} color={fg} strokeWidth={2.4} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1c1c1c' },
});
