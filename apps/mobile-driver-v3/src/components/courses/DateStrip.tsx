import { useEffect, useMemo, useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

interface Props {
  selected: Date;
  onSelect: (date: Date) => void;
  // Map ISO date (yyyy-mm-dd) -> count. Affiche un dot sur les jours avec courses.
  countByDay?: Record<string, number>;
  rangeBefore?: number;
  rangeAfter?: number;
  /**
   * Si true : on filtre la bande pour n'afficher QUE les jours qui ont une
   * course (countByDay[iso] > 0), plus toujours aujourd'hui (entree par defaut)
   * et le jour selectionne. Evite de devoir swiper a travers 20 jours vides
   * quand le chauffeur n'a qu'une course dans 3 jours. Demande 2026-05-24.
   */
  compactDaysOnly?: boolean;
}

const DOW = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
const CHIP_WIDTH = 60;
const CHIP_HEIGHT = 78;
const GAP = 8;

// Bande de jours scrollable horizontale (style Uber Driver). L'utilisateur
// peut basculer entre les jours -7 a +14 par defaut. Auto-scroll sur le jour
// selectionne au mount.
export function DateStrip({
  selected,
  onSelect,
  countByDay = {},
  rangeBefore = 7,
  rangeAfter = 14,
  compactDaysOnly = false,
}: Props) {
  const { colors, isDark } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  const days = useMemo(() => {
    const today = startOfDay(new Date());
    const list: Date[] = [];
    for (let i = -rangeBefore; i <= rangeAfter; i += 1) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      list.push(d);
    }
    if (!compactDaysOnly) return list;
    // Mode compact : on garde uniquement les jours avec courses + aujourd'hui
    // (point d'entree par defaut) + le jour selectionne (pour qu'il reste
    // visible meme s'il n'a pas de course).
    return list.filter((d) => {
      const iso = toIso(d);
      if ((countByDay[iso] ?? 0) > 0) return true;
      if (sameDay(d, today)) return true;
      if (sameDay(d, selected)) return true;
      return false;
    });
  }, [rangeBefore, rangeAfter, compactDaysOnly, countByDay, selected]);

  const selectedIdx = useMemo(
    () => days.findIndex((d) => sameDay(d, selected)),
    [days, selected],
  );

  useEffect(() => {
    if (selectedIdx < 0) return;
    const offset = Math.max(0, selectedIdx * (CHIP_WIDTH + GAP) - 100);
    scrollRef.current?.scrollTo({ x: offset, animated: true });
  }, [selectedIdx]);

  return (
    <View>
      <Text
        style={{
          paddingHorizontal: 20,
          paddingBottom: 8,
          fontSize: 10.5,
          fontWeight: '900',
          color: colors.inkSoft,
          letterSpacing: 1.2,
        }}
      >
        CHANGER DE JOUR
      </Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: GAP }}
      >
        {days.map((d) => {
          const active = sameDay(d, selected);
          const iso = toIso(d);
          const hasCourses = (countByDay[iso] ?? 0) > 0;
          // Cellule active : fond noir (mode light) ou accent bleu (mode dark),
          // jour-de-la-semaine en jaune, chiffre en blanc.
          const activeBg = isDark ? colors.accent : '#0A0A0A';
          return (
            <Pressable key={iso} onPress={() => onSelect(d)} style={{ width: CHIP_WIDTH }}>
              <View
                style={{
                  height: CHIP_HEIGHT,
                  borderRadius: 20,
                  backgroundColor: active ? activeBg : colors.surface,
                  borderWidth: active ? 0 : 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '900',
                    color: active ? '#FFD11A' : colors.inkSoft,
                    letterSpacing: 0.6,
                  }}
                >
                  {DOW[d.getDay()]}
                </Text>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: '900',
                    color: active ? '#FFFFFF' : colors.ink,
                    letterSpacing: -0.4,
                  }}
                >
                  {d.getDate()}
                </Text>
                {hasCourses && (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      width: 5,
                      height: 5,
                      borderRadius: 2.5,
                      backgroundColor: active ? '#FFD11A' : colors.brand,
                    }}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function startOfDay(d: Date): Date {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
