import { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import WebView from 'react-native-webview';
import type WebViewType from 'react-native-webview';
import { useGpsStore } from '@taxilink/stores';

import { useTheme } from '@/lib/theme';

interface Props {
  /** Destination active (pickup ou drop selon la phase). Pin rouge. */
  destLat: number;
  destLng: number;
}

// Carte Leaflet minimale dediee a l'ecran active : 1 pin destination rouge
// + 1 pin position chauffeur bleu mis a jour en live via useGpsStore.
// Auto-fit pour garder les 2 pins visibles. Volontairement simple (pas
// d'interactions complexes) pour rester perf cote WebView.
export function ActiveMissionMap({ destLat, destLng }: Props) {
  const { isDark } = useTheme();
  const webRef = useRef<WebViewType>(null);
  const coords = useGpsStore((s) => s.coords);

  // HTML build UNE SEULE FOIS au mount (le centre/zoom et la destination ne
  // changent pas pendant la session active de la course). La position chauffeur
  // est injectee via window.tlSetDriver(lat, lng) sans reload.
  const html = useMemo(
    () => buildHtml({ destLat, destLng, isDark, mapboxToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN }),
    [destLat, destLng, isDark],
  );

  // Push driver position dans le WebView a chaque update GPS.
  useEffect(() => {
    if (!coords || !webRef.current) return;
    webRef.current.injectJavaScript(
      `if (window.tlSetDriver) { window.tlSetDriver(${coords.lat}, ${coords.lng}); } true;`,
    );
  }, [coords?.lat, coords?.lng]);

  return (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState={false}
        scrollEnabled={false}
        bounces={false}
        androidLayerType="hardware"
      />
    </View>
  );
}

function buildHtml({
  destLat,
  destLng,
  isDark,
  mapboxToken,
}: {
  destLat: number;
  destLng: number;
  isDark: boolean;
  mapboxToken?: string;
}): string {
  const styleId = isDark ? 'dark-v11' : 'streets-v12';
  const tile = mapboxToken
    ? `https://api.mapbox.com/styles/v1/mapbox/${styleId}/tiles/{z}/{x}/{y}@2x?access_token=${mapboxToken}`
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { margin: 0; padding: 0; height: 100vh; width: 100vw; background: ${isDark ? '#1a1a1a' : '#f5f5f0'}; }
  .leaflet-control-attribution { display: none !important; }
  .driver-pin {
    background: #2563eb;
    width: 18px; height: 18px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 0 0 6px rgba(37,99,235,0.25);
  }
  .dest-pin {
    width: 28px; height: 28px;
    background: #DC2626;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 3px 6px rgba(0,0,0,0.35);
    position: relative;
  }
  .dest-pin::after {
    content: '';
    width: 10px; height: 10px;
    background: white;
    border-radius: 50%;
    position: absolute;
    top: 6px; left: 6px;
  }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var DEST = [${destLat}, ${destLng}];
  var map = L.map('map', { zoomControl: false, attributionControl: false }).setView(DEST, 14);
  L.tileLayer(${JSON.stringify(tile)}, { maxZoom: 19, tileSize: 512, zoomOffset: -1 }).addTo(map);

  var destIcon = L.divIcon({ className: 'dest-pin', iconSize: [28, 28], iconAnchor: [14, 28] });
  L.marker(DEST, { icon: destIcon }).addTo(map);

  var driverIcon = L.divIcon({ className: 'driver-pin', iconSize: [18, 18], iconAnchor: [9, 9] });
  var driverMarker = null;

  window.tlSetDriver = function(lat, lng) {
    if (driverMarker) {
      driverMarker.setLatLng([lat, lng]);
    } else {
      driverMarker = L.marker([lat, lng], { icon: driverIcon }).addTo(map);
    }
    // Auto-fit : montre les 2 pins, avec un padding genereux.
    var bounds = L.latLngBounds([[lat, lng], DEST]);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true, duration: 0.4 });
  };
</script>
</body>
</html>`;
}
