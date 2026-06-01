import type { ReactNode } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import type { Mission } from '@taxilink/supabase-types';
import { computeDisplayFare } from '@taxilink/core';

import { Icon } from '@/components/icons/Icon';
import { WhatsAppLogo } from '@/components/icons/BrandLogos';
import { useTheme } from '@/lib/theme';
import { deriveTrackerStep, relativeAgo, type DriverProfile, type TrackerStep } from './adsHelpers';

interface Props {
  mission: Mission;
  driver: DriverProfile | null;
  now: number;
}

const STEPS: { key: TrackerStep; label: string }[] = [
  { key: 'accepted', label: 'Acceptée' },
  { key: 'enroute', label: 'En route' },
  { key: 'onboard', label: 'Client à bord' },
  { key: 'done', label: 'Terminée' },
];

const ORDER: Record<TrackerStep, number> = {
  accepted: 0, enroute: 1, onboard: 2, done: 3,
};

function initials(name: string | null): string {
  if (!name) return '??';
  return name.split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

// Carte annonce ACCEPTÉE — fond bleu clair, badge bleu + sous-bloc TakerBlock + tracker 4 étapes.
// Réplique apps/web/.../ads/AdCardAccepted.tsx (avec TakerBlock + AdTracker inlinés).
export function AdCardAccepted({ mission, driver, now }: Props) {
  const { colors, isDark } = useTheme();
  // Carte ACCEPTÉE = teinte bleue accent (PWA). En dark on prend des bleus
  // assombris pour le bg, accent clair pour les marqueurs.
  const blueBg = isDark ? '#0F1B2E' : '#EFF6FF';
  const blueBorder = isDark ? '#1E3A8A' : '#BFDBFE';
  const blueBadgeBg = isDark ? '#1E3A8A' : '#BFDBFE';
  const blueInk = isDark ? '#60A5FA' : '#1E40AF';
  const time = new Date(mission.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const isCpam = mission.type === 'CPAM';
  const fare = computeDisplayFare(mission).value;
  const postedAgo = relativeAgo(mission.created_at);
  const acceptedAgo = relativeAgo(mission.accepted_at);

  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: blueBorder,
        backgroundColor: blueBg,
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 6,
      }}
    >
      {/* Header : badge ACCEPTÉE + heure */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 4,
            paddingHorizontal: 10, paddingVertical: 3,
            borderRadius: 999, backgroundColor: blueBadgeBg,
          }}
        >
          <Icon name="route" size={11} color={blueInk} strokeWidth={2.4} />
          <Text style={{ fontSize: 10.5, fontWeight: '900', color: blueInk, letterSpacing: 0.4 }}>
            ACCEPTÉE
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <Text style={{ fontSize: 12, fontWeight: '800', color: colors.ink }}>{time}</Text>
      </View>

      {/* Trajet */}
      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink, lineHeight: 19 }}>
        {mission.departure}
        <Text style={{ color: colors.inkSoft, fontWeight: '400' }}>{'  →  '}</Text>
        {mission.destination}
      </Text>

      {/* Prix · type · patient */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <Text style={{ fontSize: 12, color: colors.inkMuted }}>
          <Text style={{ fontWeight: '900', color: colors.ink }}>{fare > 0 ? `${fare.toFixed(0)} €` : '—'}</Text>
          {' · '}
          {isCpam ? 'CPAM' : 'Privé'}
        </Text>
        {mission.patient_name && (
          <Text numberOfLines={1} style={{ fontSize: 12, color: colors.inkMuted, flexShrink: 1 }}>
            {mission.patient_name}
          </Text>
        )}
      </View>

      {/* Sous-ligne timestamps */}
      {(postedAgo || acceptedAgo) && (
        <Text style={{ fontSize: 11, color: colors.inkSoft }}>
          {postedAgo && `Postée il y a ${postedAgo}`}
          {postedAgo && acceptedAgo && '  ·  '}
          {acceptedAgo && `Acceptée il y a ${acceptedAgo}`}
        </Text>
      )}

      {/* TakerBlock : avatar + nom + actions contact */}
      <TakerBlock driver={driver} acceptedAgo={acceptedAgo} />

      {/* Tracker 4 étapes */}
      <AdTracker mission={mission} now={now} />

      {/* Footer : Corriger */}
      <View
        style={{
          marginTop: 6,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: blueBorder,
          borderStyle: 'dashed',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ fontSize: 11.5, color: colors.inkSoft, flex: 1, flexShrink: 1 }} numberOfLines={1}>
          Adresse, téléphone ou patient à corriger ?
        </Text>
        <Pressable
          onPress={() => Alert.alert('Corriger', 'Édition d\'annonce — à venir.')}
          android_ripple={{ color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 4 }}
        >
          <Text style={{ fontSize: 13, color: colors.accent }}>✏</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.accent }}>Corriger</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TakerBlock({ driver, acceptedAgo }: { driver: DriverProfile | null; acceptedAgo: string }) {
  const { colors, isDark } = useTheme();
  const name = driver?.full_name ?? 'Collègue';
  const phone = driver?.phone?.replace(/\s/g, '') ?? null;
  const subline = acceptedAgo ? `Acceptée il y a ${acceptedAgo}` : 'Acceptée';

  return (
    <View
      style={{
        marginTop: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 10,
        borderRadius: 12,
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
      }}
    >
      {/* Avatar identitaire : noir + jaune brand en light. En dark : bg accent bleu
          + brandInk (blanc) — sinon brand=accent=#3B82F6 sur fond noir #0F0F0F
          devient un disque sombre quasi invisible sur la card bleue. */}
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? colors.accent : '#0F0F0F', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 11, fontWeight: '900', color: isDark ? colors.brandInk : colors.brand }}>{initials(name)}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '800', color: colors.ink }}>{name}</Text>
        <Text numberOfLines={1} style={{ fontSize: 11.5, color: colors.inkSoft, marginTop: 1 }}>{subline}</Text>
      </View>
      {phone && (
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {/* SMS — message-square (aligné PWA TakerBlock) */}
          <ContactSquare bg={colors.surfaceElevated} border={colors.border} onPress={() => Linking.openURL(`sms:${phone}`)}>
            <Icon name="message-square" size={14} color={colors.ink} strokeWidth={2.2} />
          </ContactSquare>
          {/* WhatsApp — logo officiel WhatsApp (silhouette téléphone dans bulle) sur fond brand vert */}
          <ContactSquare bg="#25D366" onPress={() => Linking.openURL(`https://wa.me/${phone.replace(/^0/, '33')}`)}>
            <WhatsAppLogo size={15} color="#FFFFFF" />
          </ContactSquare>
          {/* Appel — phone (combiné téléphone, aligné PWA) */}
          <ContactSquare bg={colors.success} onPress={() => Linking.openURL(`tel:${phone}`)}>
            <Icon name="phone" size={14} color="#FFFFFF" strokeWidth={2.4} />
          </ContactSquare>
        </View>
      )}
    </View>
  );
}

function ContactSquare({ bg, border, onPress, children }: { bg: string; border?: string; onPress: () => void; children: ReactNode }) {
  return (
    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: bg, borderWidth: border ? 1 : 0, borderColor: border, overflow: 'hidden' }}>
      <Pressable onPress={onPress} android_ripple={{ color: 'rgba(0,0,0,0.1)' }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </Pressable>
    </View>
  );
}

function AdTracker({ mission, now }: { mission: Mission; now: number }) {
  const { colors, isDark } = useTheme();
  const current = deriveTrackerStep(mission, now);
  const currentIdx = ORDER[current];
  const fillPct = currentIdx === 0 ? 0 : (currentIdx / 3) * 100;

  return (
    <View style={{ marginTop: 4, padding: 10, borderRadius: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {STEPS.map((s) => {
          const idx = ORDER[s.key];
          const done = idx < currentIdx;
          const isNow = idx === currentIdx;
          const dotColor = done ? colors.success : isNow ? colors.accent : colors.border;
          const labelColor = done || isNow ? colors.ink : colors.inkSoft;
          return (
            <View key={s.key} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: dotColor, borderWidth: 2, borderColor: colors.surfaceElevated }} />
              <Text style={{ fontSize: 9.5, fontWeight: '800', color: labelColor }}>{s.label}</Text>
            </View>
          );
        })}
      </View>
      {/* Barre de progression */}
      <View style={{ marginTop: 6, marginHorizontal: 10, height: 2, borderRadius: 1, backgroundColor: colors.border }}>
        <View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${fillPct}%`, backgroundColor: colors.success, borderRadius: 1 }} />
      </View>
    </View>
  );
}
