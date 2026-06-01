import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import type { Mission } from '@taxilink/supabase-types';
import { missionQueries, reportError } from '@taxilink/services';

import { Icon } from '@/components/icons/Icon';
import { useAuth } from '@/hooks/useAuth';
import { useBackgroundAwareInterval } from '@/hooks/useBackgroundAwareInterval';
import { useTheme } from '@/lib/theme';
import { getAdState } from '@/components/courses/ads/adsHelpers';
import { AdCardV7 } from '@/components/annonces/AdCardV7';
import { DateStrip } from '@/components/courses/DateStrip';

type SubTab = 'active' | 'transferred' | 'expired';

// Onglet 3 — Annonces : reprend l'ecran annonces.tsx (avant suppression), sous
// forme de tab interne a courses.tsx. Sous-onglets Actives/Transferees/Expirees
// + banner stuck + DateStrip filtre par jour + cards AdCardV7 (Modifier/Annuler).
export function AnnoncesTab() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [sub, setSub] = useState<SubTab>('active');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [nowTick, setNowTick] = useState(Date.now());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const tickNow = useCallback(() => setNowTick(Date.now()), []);
  useBackgroundAwareInterval(tickNow, 60_000);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString();
    missionQueries
      .getSharedByUser(user.id, cutoff)
      .then((list) => {
        if (!cancelled) setMissions(list);
      })
      .catch((err) => reportError(err, { tags: { phase: 'annonces-fetch' } }))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const grouped = useMemo(() => {
    const active: Mission[] = [];
    const transferred: Mission[] = [];
    const expired: Mission[] = [];
    for (const m of missions) {
      const state = getAdState(m, nowTick);
      if (state === 'waiting') active.push(m);
      else if (state === 'expired') expired.push(m);
      else transferred.push(m);
    }
    active.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
    transferred.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
    expired.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
    return { active, transferred, expired };
  }, [missions, nowTick]);

  const stuckCount = useMemo(() => {
    const threshold = nowTick - 2 * 3600_000;
    return grouped.active.filter((m) => new Date(m.created_at).getTime() < threshold).length;
  }, [grouped.active, nowTick]);

  const countByDay = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const m of missions) {
      if (!m.scheduled_at) continue;
      const iso = toIsoDate(new Date(m.scheduled_at));
      acc[iso] = (acc[iso] ?? 0) + 1;
    }
    return acc;
  }, [missions]);

  const visible = useMemo(() => {
    const all = grouped[sub];
    if (!selectedDate) return all;
    return all.filter((m) => isSameDay(new Date(m.scheduled_at), selectedDate));
  }, [grouped, sub, selectedDate]);

  return (
    <View style={{ flex: 1 }}>
      {/* Sous-onglets Actives / Transferees / Expirees */}
      <View
        style={{
          flexDirection: 'row',
          marginHorizontal: 16,
          marginBottom: 12,
          padding: 3,
          backgroundColor: colors.surfaceMuted,
          borderRadius: 12,
        }}
      >
        <SubPill
          label={`Actives${grouped.active.length > 0 ? ` (${grouped.active.length})` : ''}`}
          active={sub === 'active'}
          onPress={() => setSub('active')}
        />
        <SubPill
          label={`Transférées${grouped.transferred.length > 0 ? ` (${grouped.transferred.length})` : ''}`}
          active={sub === 'transferred'}
          onPress={() => setSub('transferred')}
        />
        <SubPill label="Expirées" active={sub === 'expired'} onPress={() => setSub('expired')} />
      </View>

      {/* Filtre par jour */}
      <View style={{ marginBottom: 8 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingBottom: 4,
          }}
        >
          <Text style={{ fontSize: 10.5, fontWeight: '900', color: colors.inkSoft, letterSpacing: 1.2 }}>
            FILTRER PAR JOUR
          </Text>
          {selectedDate && (
            <Pressable onPress={() => setSelectedDate(null)} hitSlop={8}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.accent }}>Tous les jours</Text>
            </Pressable>
          )}
        </View>
        <DateStrip
          selected={selectedDate ?? new Date(0)}
          onSelect={(d) => {
            if (selectedDate && isSameDay(selectedDate, d)) setSelectedDate(null);
            else setSelectedDate(d);
          }}
          countByDay={countByDay}
          rangeBefore={14}
          rangeAfter={14}
          compactDaysOnly
        />
      </View>

      {/* Stuck warning */}
      {sub === 'active' && stuckCount > 0 && (
        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            alignItems: 'center',
            marginHorizontal: 16,
            marginBottom: 10,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: isDark ? 'rgba(252,211,77,0.12)' : '#FFFAEB',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(252,211,77,0.28)' : '#FEF3C7',
          }}
        >
          <Icon name="info" size={18} color={isDark ? '#FCD34D' : '#92400E'} strokeWidth={2.2} />
          <Text style={{ flex: 1, fontSize: 11.5, color: isDark ? '#FCD34D' : '#78350F', lineHeight: 16 }}>
            <Text style={{ fontWeight: '900' }}>
              {stuckCount} annonce{stuckCount > 1 ? 's' : ''} sans preneur depuis &gt; 2h.
            </Text>
            {' '}Pense à augmenter le tarif ou élargir le partage.
          </Text>
        </View>
      )}

      {/* Liste */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : visible.length === 0 ? (
        <EmptyState sub={sub} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
          {visible.map((m) => {
            const stuck =
              sub === 'active' && new Date(m.created_at).getTime() < nowTick - 2 * 3600_000;
            const variant: 'active' | 'taken' | 'expired' = sub === 'transferred' ? 'taken' : sub;
            return (
              <AdCardV7
                key={m.id}
                mission={m}
                variant={variant}
                stuck={stuck}
                onCancelled={() => setMissions((prev) => prev.filter((x) => x.id !== m.id))}
              />
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function SubPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        height: 34,
        borderRadius: 10,
        backgroundColor: active ? colors.surface : 'transparent',
        overflow: 'hidden',
        ...(active && {
          shadowColor: '#000',
          shadowOpacity: isDark ? 0.4 : 0.06,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        }),
      }}
    >
      <Pressable
        onPress={onPress}
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ fontSize: 12.5, fontWeight: '800', color: active ? colors.ink : colors.inkSoft }}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

function EmptyState({ sub }: { sub: SubTab }) {
  const { colors } = useTheme();
  const map: Record<SubTab, { title: string; sub: string }> = {
    active: {
      title: 'Aucune annonce active',
      sub: 'Postez une course que vous ne pouvez pas faire — un collègue la prend en quelques minutes.',
    },
    transferred: {
      title: 'Aucune annonce transférée',
      sub: 'Les annonces récupérées par vos collègues apparaîtront ici.',
    },
    expired: { title: 'Aucune annonce expirée', sub: "L'historique des annonces non prises s'affiche ici." },
  };
  const content = map[sub];
  return (
    <View style={{ alignItems: 'center', paddingHorizontal: 32, paddingVertical: 48 }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.surfaceMuted,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        <Icon name="megaphone" size={22} color={colors.inkSoft} strokeWidth={1.8} />
      </View>
      <Text style={{ fontSize: 15, fontWeight: '900', color: colors.ink, marginBottom: 6 }}>
        {content.title}
      </Text>
      <Text style={{ fontSize: 13, color: colors.inkSoft, textAlign: 'center', lineHeight: 18 }}>
        {content.sub}
      </Text>
    </View>
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
