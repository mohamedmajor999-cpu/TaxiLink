import { Text, View } from 'react-native';
import type { HeatmapCell } from '@/lib/historyHeatmap';
import { useTheme } from '@/lib/theme';

interface Props {
  cells: HeatmapCell[];
}

// Intensité 0 = vide (palette neutre du theme), 1→4 = échelle jaune brand
// (yellows fonctionnent dans les deux thèmes : on garde tels quels).
function intensityBg(i: HeatmapCell['intensity'], pillBg: string): string {
  const SCALE: Record<HeatmapCell['intensity'], string> = {
    0: pillBg,
    1: '#FFEC80',
    2: '#FFE04D',
    3: '#FFD629',
    4: '#FFD11A',
  };
  return SCALE[i];
}

const MONTHS_FR = ['Janv.', 'Févr.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];

// Découpe les cellules en colonnes-semaines, alignées sur le jour de la
// semaine (lundi = 0, dimanche = 6). 1ʳᵉ et dernière colonne paddées avec
// null pour que chaque colonne ait toujours 7 cellules.
function toWeekColumns(cells: HeatmapCell[]): (HeatmapCell | null)[][] {
  if (cells.length === 0) return [];
  const cols: (HeatmapCell | null)[][] = [];
  let current: (HeatmapCell | null)[] = [];

  const firstDow = new Date(cells[0]!.date).getDay();
  const firstIdx = (firstDow + 6) % 7;
  for (let i = 0; i < firstIdx; i += 1) current.push(null);

  for (const cell of cells) {
    const dow = new Date(cell.date).getDay();
    const idx = (dow + 6) % 7;
    if (idx === 0 && current.length > 0) {
      cols.push(current);
      current = [];
    }
    current.push(cell);
  }
  if (current.length > 0) {
    while (current.length < 7) current.push(null);
    cols.push(current);
  }
  return cols;
}

function monthLabels(cols: (HeatmapCell | null)[][]): { col: number; label: string }[] {
  const seen = new Set<number>();
  const labels: { col: number; label: string }[] = [];
  cols.forEach((week, i) => {
    const first = week.find((c): c is HeatmapCell => c !== null);
    if (!first) return;
    const month = new Date(first.date).getMonth();
    if (!seen.has(month) && i > 0) {
      seen.add(month);
      labels.push({ col: i, label: MONTHS_FR[month]! });
    }
  });
  return labels;
}

// Réplique apps/web/.../HistoryHeatmap.tsx en RN (Views au lieu de CSS Grid).
export function HistoryHeatmap({ cells }: Props) {
  const { colors } = useTheme();
  const cols = toWeekColumns(cells);
  const labels = monthLabels(cols);
  const totalDays = cells.filter((c) => c.count > 0).length;
  const totalCourses = cells.reduce((s, c) => s + c.count, 0);
  const colCount = cols.length || 1;
  const months = Math.max(1, Math.round(cells.length / 30));

  return (
    <View
      style={{
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: 14,
      }}
    >
      {/* Header : titre + sous-titre + légende */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 13.5, fontWeight: '900', color: colors.ink }}>
            Activité {months} mois
          </Text>
          <Text style={{ fontSize: 11.5, color: colors.inkSoft, marginTop: 2 }}>
            {totalCourses} courses · {totalDays} jours actifs
          </Text>
        </View>
        <Legend />
      </View>

      {/* Labels mois */}
      <View style={{ position: 'relative', height: 12, marginBottom: 4 }}>
        {labels.map(({ col, label }) => (
          <Text
            key={`${col}-${label}`}
            style={{
              position: 'absolute',
              left: `${(col / colCount) * 100}%`,
              fontSize: 9,
              fontWeight: '700',
              color: colors.inkSoft,
              letterSpacing: 0.2,
            }}
          >
            {label.toUpperCase()}
          </Text>
        ))}
      </View>

      {/* Grille : 1 colonne = 1 semaine (7 cellules empilées) */}
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {cols.map((week, i) => (
          <View key={i} style={{ flex: 1, gap: 2 }}>
            {week.map((cell, j) =>
              cell === null ? (
                <View key={`empty-${i}-${j}`} style={{ aspectRatio: 1 }} />
              ) : (
                <View
                  key={cell.date}
                  style={{
                    aspectRatio: 1,
                    borderRadius: 3,
                    backgroundColor: intensityBg(cell.intensity, colors.pillBg),
                  }}
                />
              ),
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

function Legend() {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Text style={{ fontSize: 10, color: colors.inkSoft }}>Moins</Text>
      {([0, 1, 2, 3, 4] as const).map((i) => (
        <View
          key={i}
          style={{
            width: 10,
            height: 10,
            borderRadius: 2,
            backgroundColor: intensityBg(i, colors.pillBg),
          }}
        />
      ))}
      <Text style={{ fontSize: 10, color: colors.inkSoft }}>Plus</Text>
    </View>
  );
}
