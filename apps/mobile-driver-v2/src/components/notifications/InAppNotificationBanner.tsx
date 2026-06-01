import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useTheme } from '@/lib/theme';
import { useInAppNotificationStore, type InAppNotification } from './inAppNotificationStore';

const AUTO_DISMISS_MS = 6_000;
const SLIDE_IN_MS = 220;
const SLIDE_OUT_MS = 180;

// Banniere qui slide depuis le haut (style WhatsApp / heads-up Android).
// Affichee quand le store contient une notification courante. Tap = ouvre la
// mission, swipe ou auto-timeout = dismiss. Vibration courte a l'apparition
// pour signaler la notif meme si le user a le tel en silencieux.
export function InAppNotificationBanner() {
  const current = useInAppNotificationStore((s) => s.current);
  const dismiss = useInAppNotificationStore((s) => s.dismiss);
  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!current) return;
    // Vibration courte (200ms) — pareille pattern qu'une notif push entrante.
    // L'OS push channel vibre tout seul ; ici on couvre le cas in-app pur
    // (broadcast Realtime qui n'a pas declenche de push systeme).
    Vibration.vibrate(200);

    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: SLIDE_IN_MS, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: SLIDE_IN_MS, useNativeDriver: true }),
    ]).start();

    dismissTimerRef.current = setTimeout(() => animateOut(), AUTO_DISMISS_MS);

    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  // animateOut depend des Animated refs (stables) + dismiss du store (stable).
  // Pas besoin de le mettre en deps pour relancer le timer.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  function animateOut() {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -200, duration: SLIDE_OUT_MS, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: SLIDE_OUT_MS, useNativeDriver: true }),
    ]).start(() => dismiss());
  }

  if (!current) return null;
  return (
    <BannerView
      notification={current}
      translateY={translateY}
      opacity={opacity}
      onTap={() => {
        if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
        router.push(`/mission/${current.missionId}`);
        animateOut();
      }}
      onDismiss={() => {
        if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
        animateOut();
      }}
    />
  );
}

interface BannerViewProps {
  notification: InAppNotification;
  translateY: Animated.Value;
  opacity: Animated.Value;
  onTap: () => void;
  onDismiss: () => void;
}

function BannerView({ notification, translateY, opacity, onTap, onDismiss }: BannerViewProps) {
  const { colors, isDark } = useTheme();
  const accent = variantColor(notification.variant);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        transform: [{ translateY }],
        opacity,
        zIndex: 9999,
      }}
    >
      <SafeAreaView edges={['top']} style={{ paddingHorizontal: 12, paddingTop: 6 }}>
        <View
          style={{
            backgroundColor: isDark ? '#1a1a1a' : '#FFFFFF',
            borderRadius: 16,
            borderLeftWidth: 4,
            borderLeftColor: accent,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.18,
            shadowRadius: 12,
            elevation: 8,
            overflow: 'hidden',
          }}
        >
          <Pressable
            onPress={onTap}
            android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
            style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}
          >
            <View
              style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: accent,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 18 }}>{variantEmoji(notification.variant)}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '800', color: colors.ink }}>
                {notification.title}
              </Text>
              <Text numberOfLines={2} style={{ fontSize: 12.5, color: colors.inkSoft, marginTop: 2 }}>
                {notification.body}
              </Text>
            </View>
            <Pressable
              onPress={onDismiss}
              hitSlop={8}
              style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 18, color: colors.inkSoft }}>×</Text>
            </Pressable>
          </Pressable>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

function variantColor(v: InAppNotification['variant']): string {
  switch (v) {
    case 'new-mission':     return '#FFD23F';
    case 'mission-accepted': return '#16a34a';
    case 'direct-offer':    return '#dc2626';
  }
}
function variantEmoji(v: InAppNotification['variant']): string {
  switch (v) {
    case 'new-mission':     return '🚖';
    case 'mission-accepted': return '✅';
    case 'direct-offer':    return '🎯';
  }
}
