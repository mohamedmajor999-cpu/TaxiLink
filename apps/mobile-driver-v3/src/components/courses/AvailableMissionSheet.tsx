import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Mission as CoreMission } from '@taxilink/core';
import { reportError } from '@taxilink/services';
import { useMissionStore } from '@taxilink/stores';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';
import { formatKm } from '@/lib/format';

interface Props {
  mission: CoreMission | null;
  onClose: () => void;
}

// Modal en bas affichée au tap d'une carte de l'onglet Disponibles. 2 actions :
// - "Voir le détail" → route /mission/[id] (lecture seule, infos enrichies)
// - "Accepter cette course" → useMissionStore.acceptMission puis redirect
//   vers la course en cours (status=IN_PROGRESS apres accept).
export function AvailableMissionSheet({ mission, onClose }: Props) {
  const { colors, isDark } = useTheme();
  const acceptMission = useMissionStore((s) => s.acceptMission);
  const [accepting, setAccepting] = useState(false);

  const visible = mission !== null;

  async function handleAccept() {
    if (!mission || accepting) return;
    setAccepting(true);
    try {
      await acceptMission(mission.id);
      onClose();
      router.push(`/mission/${mission.id}`);
    } catch (err) {
      reportError(err, { tags: { phase: 'available-accept' } });
      Alert.alert(
        'Acceptation impossible',
        err instanceof Error ? err.message : 'Quelqu\'un l\'a peut-être déjà prise. Réessaie.',
      );
    } finally {
      setAccepting(false);
    }
  }

  function handleDetail() {
    if (!mission) return;
    onClose();
    router.push(`/mission/${mission.id}`);
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      {/* Wrapper centre : la sheet flotte au milieu de l'ecran (pas en bas)
          pour ne plus passer sous la barre systeme Android. Demande 2026-05-24. */}
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', paddingHorizontal: 16 }}
      >
        {/* Pressable interne sans onPress = absorbe le tap sur la card pour ne pas fermer */}
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: colors.bg,
            borderRadius: 20,
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 22,
          }}
        >
        {mission && (
          <>
            {/* Header : route + prix */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 11, fontWeight: '900', color: colors.inkSoft, letterSpacing: 1.2 }}>
                  COURSE DISPONIBLE
                </Text>
                <Text
                  numberOfLines={2}
                  style={{ marginTop: 4, fontSize: 17, fontWeight: '900', color: colors.ink, letterSpacing: -0.4, lineHeight: 21 }}
                >
                  {mission.departure}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 4 }}>
                  <Icon name="arrow-right" size={14} color={colors.inkSoft} strokeWidth={2.4} />
                  <Text
                    numberOfLines={2}
                    style={{ fontSize: 17, fontWeight: '900', color: colors.ink, letterSpacing: -0.4, flex: 1, lineHeight: 21 }}
                  >
                    {mission.destination}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 24, fontWeight: '900', color: colors.ink, letterSpacing: -0.6 }}>
                  {mission.priceEur > 0 ? `${mission.priceEur.toFixed(0)} €` : '—'}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.inkSoft, marginTop: 2 }}>
                  {mission.type === 'CPAM' ? 'CPAM' : 'PRIVÉ'}
                </Text>
              </View>
            </View>

            {/* Meta : heure + distance */}
            <View style={{ flexDirection: 'row', gap: 18, marginTop: 14 }}>
              <Meta
                icon="clock"
                label="Heure"
                value={new Date(mission.scheduledAt).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              />
              {mission.distanceKm > 0 && (
                <Meta icon="route" label="Distance" value={`${formatKm(mission.distanceKm)} km`} />
              )}
              {mission.patientName && (
                <Meta icon="user" label="Patient" value={mission.patientName} />
              )}
            </View>

            {/* Actions stack verticalement : Accepter en haut (CTA principal,
                pleine largeur pour que "Accepter cette course" + icone tiennent
                largement), Voir le detail en bas. Avant : row avec flex 1/1.4
                => bouton accepter trop etroit sur petits ecrans, texte tronque. */}
            <View style={{ gap: 10, marginTop: 22 }}>
              <View
                style={{
                  height: 56,
                  borderRadius: 14,
                  backgroundColor: isDark ? colors.accent : '#0A0A0A',
                  overflow: 'hidden',
                  opacity: accepting ? 0.7 : 1,
                }}
              >
                <Pressable
                  onPress={handleAccept}
                  disabled={accepting}
                  android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                  }}
                >
                  {accepting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Icon name="check" size={18} color="#FFFFFF" strokeWidth={2.8} />
                      <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.2 }}>
                        Accepter cette course
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
              <View
                style={{
                  height: 48,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  overflow: 'hidden',
                }}
              >
                <Pressable
                  onPress={handleDetail}
                  android_ripple={{ color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.inkMuted }}>Voir le détail</Text>
                </Pressable>
              </View>
            </View>
          </>
        )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Meta({ icon, label, value }: { icon: 'clock' | 'route' | 'user'; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Icon name={icon} size={11} color={colors.inkSoft} strokeWidth={2.2} />
        <Text style={{ fontSize: 10, fontWeight: '900', color: colors.inkSoft, letterSpacing: 0.6 }}>
          {label.toUpperCase()}
        </Text>
      </View>
      <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '800', color: colors.ink, marginTop: 2 }}>
        {value}
      </Text>
    </View>
  );
}
