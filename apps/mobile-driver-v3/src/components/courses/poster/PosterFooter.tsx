import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

// Hauteur de la BottomNav globale, reservee en bas pour que les CTA Publier/
// Publier+Partager ne soient pas masques sous la nav (absolute, zIndex 9999).
const BOTTOM_NAV_HEIGHT = 64;

interface Props {
  type: 'CPAM' | 'PRIVE';
  medicalMotif: 'HDJ' | 'CONSULTATION' | null;
  previewFare: { value: number; isEstimated: boolean; min: number | null; max: number | null };
  distanceKm: number | null;
  durationMin: number | null;
  loadingRoute: boolean;
  saving: boolean;
  canSubmit: boolean;
  error: string | null;
  onSubmit: () => void;
  onSubmitAndShare: () => void;
}

/**
 * Footer du formulaire : prix live (saisie utilisateur ou estimation auto),
 * distance/durée (calcul Google Routes), CTA publier et publier+WhatsApp.
 */
export function PosterFooter({
  type, medicalMotif, previewFare,
  distanceKm, durationMin, loadingRoute,
  saving, canSubmit, error,
  onSubmit, onSubmitAndShare,
}: Props) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const tag = type === 'CPAM' ? `CPAM ${medicalMotif ?? ''}`.trim() : 'Privé';
  const tagColor = type === 'CPAM' ? colors.accent : colors.ink;
  const priceLabel = formatPriceLabel(previewFare);

  // CTA noir → bleu Tesla en dark
  const submitBg = isDark ? colors.accent : '#0F0F0F';
  const submitBgDisabled = isDark ? colors.surfaceMuted : '#9A9A8E';
  // CTA WhatsApp : vert WhatsApp brand (#25D366) plus clair que `colors.success`
  // (#16A34A) qui paraissait trop foncé/saturé. En dark on tient `colors.success`
  // de la palette (#34D399 = vert clair lisible sur fond gris-bleu).
  const shareBg = canSubmit
    ? (isDark ? colors.success : '#25D366')
    : (isDark ? colors.surfaceMuted : '#CFE9D6');

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 12,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 0.5, color: colors.inkSoft, textTransform: 'uppercase' }}>
            Prix
          </Text>
          <Text style={{ fontSize: 26, fontWeight: '800', color: colors.ink, letterSpacing: -0.6, marginTop: 4 }}>
            {priceLabel}
          </Text>
          {previewFare.isEstimated && previewFare.value > 0 && (
            <Text style={{ fontSize: 10.5, fontWeight: '600', color: colors.inkSoft, marginTop: 1 }}>Estimé</Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tagColor }} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: tagColor, textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {tag}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 0.5, color: colors.inkSoft, textTransform: 'uppercase' }}>
            Distance
          </Text>
          <View style={{ marginTop: 6, alignItems: 'flex-end' }}>
            {loadingRoute ? (
              <ActivityIndicator size="small" color={colors.inkSoft} />
            ) : (
              <>
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.ink }}>
                  {distanceKm != null ? `${distanceKm.toFixed(1)} km` : '—'}
                </Text>
                {durationMin != null && (
                  <Text style={{ fontSize: 11.5, fontWeight: '600', color: colors.inkSoft, marginTop: 1 }}>
                    {Math.round(durationMin)} min
                  </Text>
                )}
              </>
            )}
          </View>
        </View>
      </View>

      {error && (
        <View style={{ backgroundColor: colors.dangerSoft, borderRadius: 10, padding: 10 }}>
          <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.danger }}>{error}</Text>
        </View>
      )}

      <View style={{ height: 54, borderRadius: 16, backgroundColor: canSubmit ? submitBg : submitBgDisabled, overflow: 'hidden' }}>
        <Pressable
          disabled={!canSubmit}
          onPress={onSubmit}
          android_ripple={{ color: 'rgba(255,255,255,0.12)' }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
        >
          {saving ? (
            <ActivityIndicator color={colors.brand} />
          ) : (
            <>
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>Publier la course</Text>
              <Icon name="arrow-right" size={18} color={colors.brand} strokeWidth={2.4} />
            </>
          )}
        </Pressable>
      </View>

      <View style={{ height: 54, borderRadius: 16, backgroundColor: shareBg, overflow: 'hidden' }}>
        <Pressable
          disabled={!canSubmit || saving}
          onPress={onSubmitAndShare}
          android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }}
        >
          <Icon name="message-circle" size={18} color="#FFFFFF" strokeWidth={2.4} />
          <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>
            Publier et partager sur WhatsApp
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function formatPriceLabel(p: { value: number; min: number | null; max: number | null }): string {
  if (p.min != null && p.max != null && p.min !== p.max) return `${p.min}-${p.max} €`;
  if (p.value > 0) return `${p.value.toFixed(0)} €`;
  return '—';
}
