import { Children, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, Text, View } from 'react-native';
import type { Group } from '@taxilink/core';

import { Icon, type IconName } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';
import type { PosterCourseState } from './usePosterCourse';

interface Props {
  c: PosterCourseState;
}

export function PosterPreflight({ c }: Props) {
  const { colors, isDark } = useTheme();
  const [remember, setRemember] = useState(c.matchesSavedDefaults);
  useEffect(() => { setRemember(c.matchesSavedDefaults); }, [c.matchesSavedDefaults]);
  const groups = sortedGroups(c.myGroups);

  const ctaBg = isDark ? colors.accent : '#0F0F0F';
  const ctaBgDisabled = isDark ? `${colors.accent}66` : '#0F0F0F66';
  const checkboxBg = remember ? (isDark ? colors.accent : '#0F0F0F') : colors.surface;
  const checkboxBorder = remember ? (isDark ? colors.accent : '#0F0F0F') : colors.inkSoft;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', letterSpacing: 0.8, color: colors.inkSoft, textTransform: 'uppercase', marginBottom: 8 }}>
            ÉTAPE 1/2
          </Text>
          <Text style={{ fontSize: 32, fontWeight: '800', color: colors.ink, letterSpacing: -0.8, lineHeight: 36 }}>
            À qui partager,
          </Text>
          <Text style={{ fontSize: 32, fontWeight: '800', color: colors.inkSoft, letterSpacing: -0.8, lineHeight: 36 }}>
            et quel type ?
          </Text>
          <Text style={{ fontSize: 14, color: colors.inkMuted, marginTop: 12, lineHeight: 21 }}>
            Choisis le groupe et le type. Le micro et les autres champs s'ouvriront ensuite.
          </Text>
        </View>

        <View style={{ marginBottom: 22 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', letterSpacing: 0.6, color: colors.inkSoft, textTransform: 'uppercase' }}>
              À qui
            </Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.inkSoft }}>
              Plusieurs groupes possibles
            </Text>
          </View>
          <Grid2>
            <PickCard
              active={c.visibility === 'PUBLIC'}
              onPress={c.onSelectPublic}
              icon="globe"
              title="Tous"
              sub="CHAUFFEURS"
            />
            {c.loadingGroups
              ? [0, 1, 2].map((i) => <SkeletonCard key={`sk-${i}`} />)
              : groups.map((g) => {
                  const isActive = c.visibility === 'GROUP' && c.groupIds.includes(g.id);
                  const icon: IconName = g.fleetOrgId ? 'building' : isActive ? 'users-plus' : 'users';
                  return (
                    <PickCard
                      key={g.id}
                      active={isActive}
                      onPress={() => c.toggleGroup(g.id)}
                      icon={icon}
                      title={g.fleetOrgId ? 'Ma flotte' : g.name}
                      sub={typeof g.memberCount === 'number' ? `${g.memberCount} MEMBRES` : 'GROUPE'}
                    />
                  );
                })}
          </Grid2>
          {!c.loadingGroups && c.visibility === 'GROUP' && c.groupIds.length === 0 && c.myGroups.length > 0 && (
            <Text style={{ marginTop: 8, fontSize: 12.5, fontWeight: '700', color: colors.danger }}>
              Sélectionnez au moins un groupe.
            </Text>
          )}
          {!c.loadingGroups && c.myGroups.length === 0 && c.visibility !== 'PUBLIC' && (
            <Text style={{ marginTop: 8, fontSize: 12.5, color: colors.inkSoft }}>
              Aucun groupe. Choisis « Tous » pour publier.
            </Text>
          )}
        </View>

        <View style={{ marginBottom: 22 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', letterSpacing: 0.6, color: colors.inkSoft, textTransform: 'uppercase', marginBottom: 10 }}>
            Type de course
          </Text>
          <Grid2>
            <PickCard active={c.type === 'PRIVE'} onPress={() => c.setType('PRIVE')} icon="car" title="Standard" sub="PRIVÉ" />
            <PickCard active={c.type === 'CPAM'} onPress={() => c.setType('CPAM')} icon="briefcase-medical" title="CPAM" sub="MÉDICAL" />
          </Grid2>
        </View>
      </ScrollView>

      {/* Footer sticky : checkbox + bouton "Continuer" toujours visibles */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 14,
          paddingBottom: 16,
          borderTopWidth: 1,
          borderTopColor: colors.borderSoft,
          backgroundColor: colors.bg,
        }}
      >
        <Pressable
          onPress={() => setRemember((v) => !v)}
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 6, marginBottom: 12 }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: remember }}
        >
          <View
            style={{
              width: 22, height: 22, borderRadius: 6, borderWidth: 2,
              borderColor: checkboxBorder,
              backgroundColor: checkboxBg,
              alignItems: 'center', justifyContent: 'center',
              marginTop: 1,
            }}
          >
            {remember && <Icon name="check" size={14} color="#FFFFFF" strokeWidth={3} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink }}>Mémoriser comme préréglage</Text>
            <Text style={{ fontSize: 12, color: colors.inkSoft, marginTop: 2 }}>Pré-sélectionné à la prochaine création.</Text>
          </View>
        </Pressable>

        <View
          style={{
            height: 64,
            borderRadius: 20,
            backgroundColor: c.canContinue ? ctaBg : ctaBgDisabled,
            overflow: 'hidden',
          }}
        >
          <Pressable
            disabled={!c.canContinue}
            onPress={() => c.passGate(remember)}
            android_ripple={{ color: 'rgba(255,255,255,0.12)' }}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 10,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: -0.2 }}>Continuer</Text>
            {/* Même piège qu'au-dessus : ctaBg=accent en dark, brand=accent en dark
                → flèche invisible. brandInk (blanc) en dark. */}
            <Icon name="arrow-right" size={20} color={isDark ? colors.brandInk : colors.brand} strokeWidth={2.6} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  // Children.toArray aplatit les sous-arrays venus de {array.map(...)} et
  // ajoute des keys. Sans ça, `<Grid2><A/>{list.map(...)}</Grid2>` rend
  // [A, [B, C, D]] et les groupes s'empilent dans une colonne.
  const items = Children.toArray(children);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
      {items.map((node, i) => (
        <View key={i} style={{ width: '50%', padding: 6 }}>
          {node}
        </View>
      ))}
    </View>
  );
}

function PickCard({
  active, onPress, icon, title, sub,
}: { active: boolean; onPress: () => void; icon: IconName; title: string; sub: string }) {
  const { colors, isDark } = useTheme();
  // Pattern wrapper-View pour Android : les styles container (bg, border,
  // radius, padding) restent sur le View parent, le Pressable interne ne
  // gère que le touch + ripple. Sinon Android RN perd les styles visuels
  // quand on passe une fonction au prop style de Pressable.
  const activeBg = isDark ? colors.accent : '#0F0F0F';
  return (
    <View
      style={{
        backgroundColor: active ? activeBg : colors.surfaceElevated,
        borderWidth: active ? 0 : 1.5,
        borderColor: colors.border,
        borderRadius: 18,
        minHeight: 136,
        overflow: 'hidden',
        ...(active
          ? {}
          : {
              shadowColor: '#000',
              shadowOpacity: isDark ? 0.45 : 0.05,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 1 },
              elevation: 1,
            }),
      }}
    >
      <Pressable
        onPress={onPress}
        android_ripple={{ color: active ? 'rgba(255,255,255,0.10)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)') }}
        style={{
          flex: 1,
          paddingHorizontal: 18,
          paddingVertical: 18,
          justifyContent: 'space-between',
        }}
      >
        <View>
          {/* En dark : bg active = colors.accent (#3B82F6) et colors.brand = aussi
              #3B82F6 → icone invisible. On force brandInk (blanc) en dark mode
              quand active, sinon on garde le jaune brand sur fond noir en light. */}
          <Icon
            name={icon}
            size={24}
            color={active ? (isDark ? colors.brandInk : colors.brand) : colors.inkMuted}
            strokeWidth={2}
          />
        </View>
        <View>
          <Text numberOfLines={1} style={{ fontSize: 18, fontWeight: '800', color: active ? '#FFFFFF' : colors.ink, letterSpacing: -0.3, marginBottom: 4 }}>
            {title}
          </Text>
          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.1, color: active ? '#FFFFFFCC' : colors.inkSoft }}>
            {sub}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

function SkeletonCard() {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.55)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: 18,
        minHeight: 136,
        padding: 18,
        justifyContent: 'space-between',
        opacity,
      }}
    >
      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.border }} />
      <View>
        <View style={{ height: 16, width: '70%', borderRadius: 4, backgroundColor: colors.border, marginBottom: 8 }} />
        <View style={{ height: 10, width: '45%', borderRadius: 3, backgroundColor: colors.borderSoft }} />
      </View>
    </Animated.View>
  );
}

function sortedGroups(groups: Group[]): Group[] {
  return [...groups].sort((a, b) => {
    const af = a.fleetOrgId ? 0 : 1;
    const bf = b.fleetOrgId ? 0 : 1;
    return af - bf;
  });
}
