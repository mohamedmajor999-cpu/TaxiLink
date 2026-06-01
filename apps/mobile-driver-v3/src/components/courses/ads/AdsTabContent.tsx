import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { Mission } from '@taxilink/supabase-types';
import { missionQueries, profileService, reportError } from '@taxilink/services';
import {
  usePostedAcceptStore,
  usePostedUntakenStore,
  useUnseenAcceptCount,
  useUnseenUntakenCount,
} from '@taxilink/stores';

import { Icon } from '@/components/icons/Icon';
import { useAuth } from '@/hooks/useAuth';
import { useBackgroundAwareInterval } from '@/hooks/useBackgroundAwareInterval';
import { useTheme } from '@/lib/theme';
import {
  type AdView,
  type DriverProfile,
  addDays,
  agendaDayLabel,
  buildAdDays,
  getAdState,
  startOfDay,
} from './adsHelpers';
import { WeekStrip } from './WeekStrip';
import { AdCardWaiting } from './AdCardWaiting';
import { AdCardAccepted } from './AdCardAccepted';

// Onglet Annonces fidèle à apps/web/.../ads/AdsTab.tsx :
// - Banner "X nouveautés" (stub : compte les annonces 'accepted' non vues localement)
// - WeekStrip 7 jours navigables
// - Liste des annonces du jour sélectionné, segmentées par état (waiting / accepted / done)
// Stubs : realtime + edit/correction sheet ne sont pas encore portés.
export function AdsTabContent() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [profiles, setProfiles] = useState<Record<string, DriverProfile>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Date());
  const [nowTick, setNowTick] = useState(Date.now());

  // Compteur "nouvelles notifs" = somme des notifs non vues sur les 2 stores
  // partages (postedAccept + postedUntaken), persistees via AsyncStorage.
  // Le bouton "Tout marquer comme lu" appelle clearUnseen() sur les 2.
  const unseenAccepts = useUnseenAcceptCount();
  const unseenUntaken = useUnseenUntakenCount();
  const unseenCount = unseenAccepts + unseenUntaken;
  const clearAccepts = usePostedAcceptStore((s) => s.clearUnseen);
  const clearUntaken = usePostedUntakenStore((s) => s.clearUnseen);

  // Fetch annonces postées par l'utilisateur (cutoff = 30j en arrière)
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString();
    (async () => {
      try {
        const list = await missionQueries.getSharedByUser(user.id, cutoff);
        if (cancelled) return;
        setMissions(list);

        const driverIds = Array.from(new Set(list.map((m) => m.driver_id).filter((id): id is string => !!id)));
        if (driverIds.length > 0) {
          const profs = await profileService.getContactsByIds(driverIds);
          if (cancelled) return;
          const map: Record<string, DriverProfile> = {};
          for (const p of profs) map[p.id] = { full_name: p.full_name, phone: p.phone };
          setProfiles(map);
        }
      } catch (err) {
        reportError(err, { tags: { phase: 'ads-fetch' } });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Tick chaque minute pour refresh tracker. Pause en background.
  const tickNow = useCallback(() => setNowTick(Date.now()), []);
  useBackgroundAwareInterval(tickNow, 60_000);

  const ads = useMemo<AdView[]>(
    () => missions.map((m) => ({
      mission: m,
      state: getAdState(m, nowTick),
      driver: m.driver_id ? profiles[m.driver_id] ?? null : null,
    })),
    [missions, profiles, nowTick],
  );

  const daysGroups = useMemo(() => buildAdDays(ads), [ads]);

  // Bornes : 30j en arriere → 60j en avant. Carrousel jour par jour.
  const minDate = useMemo(() => startOfDay(addDays(new Date(), -30)), []);
  const maxDate = useMemo(() => startOfDay(addDays(new Date(), 60)), []);

  // count annonces par jour (badge sous chaque date).
  const countsByKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of ads) {
      const k = new Date(a.mission.scheduled_at).toDateString();
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return map;
  }, [ads]);
  const getDayMeta = (date: Date) => ({
    count: countsByKey.get(date.toDateString()) ?? 0,
  });

  if (loading) {
    return (
      <View style={{ paddingVertical: 60, alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (daysGroups.length === 0) {
    return <EmptyState />;
  }

  const selectedKey = selected.toDateString();
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const visibleGroup = daysGroups.find((g) => g.key === selectedKey);
  const dayLabel = visibleGroup?.label ?? agendaDayLabel(selected, today, tomorrow);

  return (
    <View style={{ gap: 14, paddingBottom: 24 }}>
      {/* Banner "X nouveautés" + Tout marquer comme lu */}
      {unseenCount > 0 && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 14,
            borderWidth: 1,
            // En light : halo jaune brand. En dark : halo bleu accent (cohérent
            // avec la palette night où brand=accent=#3B82F6).
            borderColor: isDark ? 'rgba(59,130,246,0.45)' : 'rgba(255, 209, 26, 0.4)',
            backgroundColor: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(255, 209, 26, 0.1)',
          }}
        >
          <Text style={{ flex: 1, fontSize: 12.5, fontWeight: '800', color: colors.ink }} numberOfLines={2}>
            {unseenCount} nouveauté{unseenCount > 1 ? 's' : ''} sur tes annonces
          </Text>
          <View style={{ borderRadius: 999, backgroundColor: isDark ? colors.accent : '#0F0F0F', overflow: 'hidden' }}>
            <Pressable
              onPress={() => { clearAccepts(); clearUntaken(); }}
              android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7 }}
            >
              <Text style={{ fontSize: 11.5, fontWeight: '900', color: '#FFFFFF' }}>✓✓ Tout marquer comme lu</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Carrousel : pilule noire fixe au centre, dates qui defilent. */}
      <WeekStrip
        selected={selected}
        onSelectedChange={setSelected}
        minDate={minDate}
        maxDate={maxDate}
        getDayMeta={getDayMeta}
      />

      {/* Header jour + count */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 2 }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.ink, textTransform: 'capitalize' }}>
          {dayLabel}
        </Text>
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.inkSoft }}>
          {visibleGroup ? `${visibleGroup.ads.length} annonce${visibleGroup.ads.length > 1 ? 's' : ''}` : '0 annonce'}
        </Text>
      </View>

      {/* Liste cartes */}
      {!visibleGroup && (
        <View
          style={{
            borderRadius: 14,
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: colors.border,
            backgroundColor: colors.surfaceMuted,
            paddingVertical: 32,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 13, color: colors.inkSoft }}>Aucune annonce ce jour-là</Text>
        </View>
      )}

      {visibleGroup?.ads.map((ad) => {
        if (ad.state === 'waiting' || ad.state === 'expired') {
          return (
            <AdCardWaiting
              key={ad.mission.id}
              mission={ad.mission}
              onCancelled={() => setMissions((prev) => prev.filter((m) => m.id !== ad.mission.id))}
            />
          );
        }
        if (ad.state === 'accepted') {
          return <AdCardAccepted key={ad.mission.id} mission={ad.mission} driver={ad.driver} now={nowTick} />;
        }
        // done : carte simple lecture seule (réutilise le visuel "accepted" sans tracker actif)
        return <AdCardAccepted key={ad.mission.id} mission={ad.mission} driver={ad.driver} now={nowTick} />;
      })}
    </View>
  );
}

function EmptyState() {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 }}>
      <View
        style={{
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: colors.surfaceMuted,
          borderWidth: 1, borderColor: colors.border,
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <Icon name="megaphone" size={22} color={colors.inkSoft} strokeWidth={1.8} />
      </View>
      <Text style={{ fontSize: 15, fontWeight: '800', color: colors.ink, marginBottom: 4 }}>
        Aucune annonce
      </Text>
      <Text style={{ fontSize: 13, color: colors.inkSoft, textAlign: 'center', lineHeight: 18 }}>
        Une course que tu ne peux pas faire ?{'\n'}Un collègue la prend en 30 secondes.
      </Text>
    </View>
  );
}

