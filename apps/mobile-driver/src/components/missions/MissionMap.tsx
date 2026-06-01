import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { StyleSheet, View, Text } from 'react-native'
import MapView, { Marker, UrlTile, type Region } from 'react-native-maps'

import type { Mission } from '@taxilink/supabase-types'
import { computeDisplayFare } from '@taxilink/core'

interface Props {
  missions: Mission[]
  selectedId: string | null
  onSelectMission: (id: string) => void
  userCoords: { lat: number; lng: number } | null
}

export interface MissionMapHandle {
  panToMission: (mission: Mission) => void
  panToUser: () => void
  zoomIn: () => void
  zoomOut: () => void
}

// Carte plein ecran avec tuiles OSM (gratuit, pas de cle API requise).
// Affiche un pin "prix" pour chaque mission. Le pin selectionne est en jaune.
export const MissionMap = forwardRef<MissionMapHandle, Props>(function MissionMap(
  { missions, selectedId, onSelectMission, userCoords },
  ref,
) {
  const mapRef = useRef<MapView>(null)

  // Region initiale : centree sur Marseille par defaut, ou sur l'user si dispo.
  const initialRegion = useMemo<Region>(() => {
    if (userCoords) {
      return {
        latitude: userCoords.lat,
        longitude: userCoords.lng,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      }
    }
    return {
      latitude: 43.4,
      longitude: 5.2,
      latitudeDelta: 0.8,
      longitudeDelta: 0.8,
    }
  }, [userCoords])

  useImperativeHandle(ref, () => ({
    panToMission: (m: Mission) => {
      if (!m.departure_lat || !m.departure_lng) return
      mapRef.current?.animateToRegion({
        latitude: Number(m.departure_lat),
        longitude: Number(m.departure_lng),
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 400)
    },
    panToUser: () => {
      if (!userCoords) return
      mapRef.current?.animateToRegion({
        latitude: userCoords.lat,
        longitude: userCoords.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 400)
    },
    zoomIn: () => {
      mapRef.current?.getCamera().then((cam) => {
        mapRef.current?.animateCamera({ ...cam, zoom: (cam.zoom ?? 10) + 1 }, { duration: 300 })
      }).catch(() => {})
    },
    zoomOut: () => {
      mapRef.current?.getCamera().then((cam) => {
        mapRef.current?.animateCamera({ ...cam, zoom: Math.max(2, (cam.zoom ?? 10) - 1) }, { duration: 300 })
      }).catch(() => {})
    },
  }), [userCoords])

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={initialRegion}
      mapType="none"
      showsUserLocation={Boolean(userCoords)}
      showsMyLocationButton={false}
      showsCompass={false}
      toolbarEnabled={false}
    >
      {/* Tuiles CARTO Voyager : OSM-style, libre, pas de cle, accepte mobile UA.
          Equivalent du Leaflet+OSM utilise par la PWA, sans le blocage de tile.openstreetmap.org. */}
      <UrlTile
        urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
        maximumZ={19}
        flipY={false}
      />

      {missions.map((m) => {
        if (m.departure_lat == null || m.departure_lng == null) return null
        const fare = computeDisplayFare(m)
        const isSelected = selectedId === m.id
        const isCpam = m.type === 'CPAM'
        return (
          <Marker
            key={m.id}
            coordinate={{
              latitude: Number(m.departure_lat),
              longitude: Number(m.departure_lng),
            }}
            onPress={() => onSelectMission(m.id)}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={[styles.pinWrap, isSelected && styles.pinWrapSelected]}>
              <View style={[styles.pin, isSelected && styles.pinSelected]}>
                <View style={[styles.pinIcon, isCpam ? styles.pinIconCpam : styles.pinIconPrive]}>
                  <Text style={styles.pinIconText}>{isCpam ? 'H' : '€'}</Text>
                </View>
                <Text style={styles.pinPrice}>
                  {Math.round(fare.value)} €
                </Text>
              </View>
              <View style={[styles.pinTail, isSelected && styles.pinTailSelected]} />
            </View>
          </Marker>
        )
      })}
    </MapView>
  )
})

const styles = StyleSheet.create({
  pinWrap: {
    alignItems: 'center',
  },
  pinWrapSelected: {
    transform: [{ scale: 1.1 }],
  },
  pin: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#1A1A1A',
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: 2,
    paddingLeft: 2,
    paddingRight: 10,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  pinSelected: {
    backgroundColor: '#FFD23F',
  },
  pinIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinIconCpam: {
    backgroundColor: '#1A1A1A',
  },
  pinIconPrive: {
    backgroundColor: '#3B82F6',
  },
  pinIconText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  pinPrice: {
    color: '#1A1A1A',
    fontWeight: '800',
    fontSize: 13,
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1A1A1A',
    marginTop: -1,
  },
  pinTailSelected: {
    borderTopColor: '#1A1A1A',
  },
})
