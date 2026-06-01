import { useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { FR_DAY_SHORT_PUB, sameDay, startOfDay } from './adsHelpers';
import { useTheme } from '@/lib/theme';

const FR_DAY_SHORT = FR_DAY_SHORT_PUB;

interface DayMeta {
  count: number;
  disabled?: boolean;
}

interface Props {
  selected: Date;
  onSelectedChange: (d: Date) => void;
  minDate: Date;
  maxDate: Date;
  getDayMeta: (date: Date) => DayMeta;
}

const VISIBLE = 7;
// Index "visuellement centre" dans la fenetre de 7 jours visibles (semaine).
// = 3 → le jour selectionne s'aligne sur la 4e case (centre exact).
const CENTER_OFFSET = 3;

// Carrousel de dates style iOS : la pilule noire est fixe au centre, les
// dates defilent dessous (snap sur 1 jour). Les fleches scrollent
// programmatiquement de ±1 jour. Le jour selectionne = celui sous la pilule.
export function WeekStrip({ selected, onSelectedChange, minDate, maxDate, getDayMeta }: Props) {
  const { colors, isDark } = useTheme();
  const [containerW, setContainerW] = useState(0);
  const dayW = containerW > 0 ? containerW / VISIBLE : 0;
  const scrollRef = useRef<ScrollView>(null);

  // Pre-calcule toutes les dates de la fenetre [minDate, maxDate].
  const days = useMemo(() => {
    const out: Date[] = [];
    const cur = startOfDay(minDate);
    const max = startOfDay(maxDate);
    while (cur.getTime() <= max.getTime()) {
      out.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  }, [minDate, maxDate]);

  const selectedIdx = useMemo(
    () => days.findIndex((d) => sameDay(d, selected)),
    [days, selected],
  );

  // centerIdx = jour visuellement sous la pilule (update en live pendant scroll).
  // Permet de colorer en blanc le texte du jour centre.
  const [centerIdx, setCenterIdx] = useState(selectedIdx);

  // Resync scroll quand selected change (depuis exterieur ou apres swipe).
  useEffect(() => {
    if (dayW <= 0 || selectedIdx < 0) return;
    const target = selectedIdx * dayW;
    scrollRef.current?.scrollTo({ x: target, animated: true });
    setCenterIdx(selectedIdx);
  }, [selectedIdx, dayW]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (dayW <= 0) return;
    const ci = Math.round(e.nativeEvent.contentOffset.x / dayW);
    if (ci !== centerIdx && ci >= 0 && ci < days.length) setCenterIdx(ci);
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (dayW <= 0) return;
    const ci = Math.round(e.nativeEvent.contentOffset.x / dayW);
    const newDay = days[ci];
    if (newDay && !sameDay(newDay, selected)) {
      onSelectedChange(newDay);
    }
  };

  const goPrev = () => {
    if (selectedIdx <= 0 || dayW <= 0) return;
    scrollRef.current?.scrollTo({ x: (selectedIdx - 1) * dayW, animated: true });
  };
  const goNext = () => {
    if (selectedIdx >= days.length - 1 || dayW <= 0) return;
    scrollRef.current?.scrollTo({ x: (selectedIdx + 1) * dayW, animated: true });
  };

  const canPrev = selectedIdx > 0;
  const canNext = selectedIdx >= 0 && selectedIdx < days.length - 1;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
      <NavBtn dir="prev" disabled={!canPrev} onPress={goPrev} />
      <View
        style={{ flex: 1, position: 'relative' }}
        onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}
      >
        {/* Pilule noire fixe au centre, derriere les dates qui scrollent. */}
        {dayW > 0 && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: CENTER_OFFSET * dayW,
              width: dayW,
              top: 0,
              bottom: 0,
              borderRadius: 999,
              backgroundColor: isDark ? colors.accent : '#0F0F0F',
              zIndex: 0,
            }}
          />
        )}
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={dayW > 0 ? dayW : undefined}
          decelerationRate="fast"
          onScroll={onScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumEnd}
          bounces={false}
          overScrollMode="never"
          contentContainerStyle={{ paddingHorizontal: CENTER_OFFSET * dayW }}
        >
          {dayW > 0 && days.map((d, idx) => {
            const meta = getDayMeta(d);
            const isCenter = idx === centerIdx;
            const disabled = meta.disabled === true;
            return (
              <Pressable
                key={d.toDateString()}
                onPress={() => !disabled && onSelectedChange(d)}
                disabled={disabled}
                style={{
                  width: dayW,
                  paddingVertical: 6,
                  alignItems: 'center',
                  gap: 1,
                  opacity: disabled && !isCenter ? 0.4 : 1,
                }}
              >
                <Text style={{ fontSize: 9.5, fontWeight: '800', color: isCenter ? 'rgba(255,255,255,0.7)' : colors.inkSoft, letterSpacing: 0.4 }}>
                  {FR_DAY_SHORT[d.getDay()]}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '900', color: isCenter ? '#FFFFFF' : disabled ? colors.inkSoft : colors.ink, lineHeight: 18 }}>
                  {d.getDate()}
                </Text>
                {/* En dark : pill bg = accent (#3B82F6) ET colors.brand = accent
                    → invisible. Force brandInk (blanc) sur la pilule en dark. */}
                <Text style={{ fontSize: 10, fontWeight: '700', color: isCenter ? (isDark ? colors.brandInk : colors.brand) : colors.inkSoft }}>
                  {meta.count > 0 ? meta.count : '—'}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <NavBtn dir="next" disabled={!canNext} onPress={goNext} />
    </View>
  );
}

function NavBtn({ dir, disabled, onPress }: { dir: 'prev' | 'next'; disabled: boolean; onPress: () => void }) {
  const { colors, isDark } = useTheme();
  return (
    <View style={{ width: 28, height: 56, borderRadius: 12, overflow: 'hidden' }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.25 : 1 }}
      >
        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.ink, lineHeight: 18 }}>
          {dir === 'prev' ? '‹' : '›'}
        </Text>
      </Pressable>
    </View>
  );
}

