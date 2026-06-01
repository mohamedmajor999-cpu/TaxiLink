import { Text, View } from 'react-native';
import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

interface Props {
  availableTotal: number;
  onlineTotal: number;
}

// Bandeau noir agrégé sur tous les groupes du chauffeur — réplique apps/web
// GroupesGlobalPulse.tsx. Toujours visible (même si zéro) pour donner un
// repère vivant en haut de la page Mes groupes.
export function GroupesGlobalPulse({ availableTotal, onlineTotal }: Props) {
  const { colors } = useTheme();
  const isQuiet = availableTotal === 0 && onlineTotal === 0;

  return (
    <View
      style={{
        marginBottom: 14,
        borderRadius: 16,
        // Bandeau focus : noir partout (light + dark). Le noir #0F0F0F sur fond
        // dark #2A2F38 reste un creux visible, et fait ressortir le texte jaune
        // brand sans tomber dans un bleu invisible.
        backgroundColor: '#0F0F0F',
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* Carré jaune translucide avec éclair */}
      <View
        style={{
          width: 38, height: 38, borderRadius: 12,
          backgroundColor: 'rgba(255, 209, 26, 0.18)',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        {/* Éclair jaune hardcodé : exception au mapping brand→bleu en dark.
            L'éclair reste l'icône "live/énergie" iconique, doit garder le jaune
            signature TaxiLink dans les 2 modes. */}
        <Icon name="zap" size={18} color="#FFD11A" strokeWidth={2.2} />
      </View>

      {/* Texte principal + sous-ligne */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 13.5, color: '#FFFFFF', lineHeight: 18, fontWeight: '600' }}>
          {isQuiet ? (
            <Text style={{ color: 'rgba(255,255,255,0.85)' }}>Pas d'activité pour le moment</Text>
          ) : (
            <>
              {availableTotal > 0 && (
                <>
                  <Text style={{ color: colors.brand, fontWeight: '900' }}>
                    {availableTotal} course{availableTotal > 1 ? 's' : ''}
                  </Text>
                  {' à prendre'}
                </>
              )}
              {availableTotal > 0 && onlineTotal > 0 && ' · '}
              {onlineTotal > 0 && (
                <>
                  <Text style={{ color: colors.brand, fontWeight: '900' }}>
                    {onlineTotal} collègue{onlineTotal > 1 ? 's' : ''}
                  </Text>
                  {' en ligne'}
                </>
              )}
            </>
          )}
        </Text>
        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
          {isQuiet ? 'Reste connecté pour ne rien rater' : 'Sur tous tes groupes maintenant'}
        </Text>
      </View>
    </View>
  );
}
