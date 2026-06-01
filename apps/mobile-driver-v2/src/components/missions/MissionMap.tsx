import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';
import type WebViewType from 'react-native-webview';
import { useGpsStore } from '@taxilink/stores';

import { useTheme } from '@/lib/theme';
import { buildLeafletHtml } from './leafletHtml';

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
}

interface Props {
  onReady?: () => void;
  onSelectMission?: (id: string) => void;
  onUserPinResult?: (ok: boolean, info: string) => void;
}

export const MissionMap = forwardRef<MissionMapHandle, Props>(
  ({ onReady, onSelectMission, onUserPinResult }, ref) => {
  const webRef = useRef<WebViewType>(null);
  const { isDark } = useTheme();

  // HTML build UNE SEULE FOIS au mount avec le mode courant + derniere coord
  // persistee. Le toggle dark/light apres mount est gere sans rebuild via
  // window.tlSetTheme (injectJavaScript) — preserve l'etat de la carte
  // (zoom, position, pins) et evite un reload Leaflet ~1s.
  const initialIsDarkRef = useRef(isDark);
  const html = useMemo(() => {
    const persisted = useGpsStore.getState().coords;
    return buildLeafletHtml({
      mapboxToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN,
      initial: persisted ? { lat: persisted.lat, lng: persisted.lng, zoom: 12 } : null,
      isDark: initialIsDarkRef.current,
    });
  }, []);

  // Sync du theme apres mount : injection JS pour basculer body.dark + swap
  // tile layer Mapbox streets-v12 <-> dark-v11. Pas de reload de WebView.
  useEffect(() => {
    webRef.current?.injectJavaScript(`window.tlSetTheme && window.tlSetTheme(${isDark ? 'true' : 'false'}); true;`);
  }, [isDark]);

  useImperativeHandle(ref, () => ({
    panTo: (region) => {
      const { latitude, longitude, zoom } = region;
      webRef.current?.injectJavaScript(`window.tlPanTo(${latitude}, ${longitude}, ${zoom ?? 'null'}); true;`);
    },
    setUserPosition: (coords) => {
      webRef.current?.injectJavaScript(`window.tlSetUserPosition(${coords.latitude}, ${coords.longitude}); true;`);
    },
    setMissions: (pins) => {
      const json = JSON.stringify(pins).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      webRef.current?.injectJavaScript(`window.tlSetMissions('${json}'); true;`);
    },
    zoomIn: () => {
      webRef.current?.injectJavaScript(`window.tlZoomIn(); true;`);
    },
    zoomOut: () => {
      webRef.current?.injectJavaScript(`window.tlZoomOut(); true;`);
    },
    setMapStyle: (style) => {
      webRef.current?.injectJavaScript(`window.tlSetMapStyle('${style}'); true;`);
    },
  }));

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#2A2F38' : '#F8F9FA' }]}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        scalesPageToFit={false}
        scrollEnabled={false}
        bounces={false}
        androidLayerType="hardware"
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'ready') onReady?.();
            else if (data.type === 'selectMission' && typeof data.id === 'string') onSelectMission?.(data.id);
            else if (data.type === 'userPin') {
              onUserPinResult?.(
                Boolean(data.ok),
                data.ok ? `${data.lat?.toFixed?.(4)}, ${data.lng?.toFixed?.(4)}` : String(data.err ?? 'err'),
              );
            }
          } catch {
            // Ignore non-JSON messages
          }
        }}
      />
    </View>
  );
});

MissionMap.displayName = 'MissionMap';

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1, backgroundColor: 'transparent' },
});
