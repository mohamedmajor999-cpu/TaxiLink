import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { DocumentRow } from '@/components/profil/DocumentRow';
import { ProfileSubHeader } from '@/components/profil/ProfileSubHeader';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentsScreen, type DocumentRowData } from '@/components/profil/useDocumentsScreen';
import { useDocumentUpload } from '@/components/profil/useDocumentUpload';
import { useTheme } from '@/lib/theme';

export default function DocumentsRoute() {
  const { user } = useAuth();
  const s = useDocumentsScreen(user?.id ?? null);
  const upload = useDocumentUpload(user?.id ?? null, s.docs, s.refresh);
  const { colors, isDark } = useTheme();
  const subtitle = s.loading ? undefined : `${s.validCount} / ${s.totalCount} à jour`;
  const errorMessage = s.error ?? upload.error;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ProfileSubHeader title="Documents" subtitle={subtitle} />
      {s.loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
        >
          {s.earliestExpiringAlert && (
            <View
              style={{
                // Callout amber : en dark on prend un fond sombre teinté + texte amber clair
                backgroundColor: isDark ? '#3F2D11' : '#FEF3C7',
                borderWidth: 1,
                borderColor: isDark ? '#7C4A18' : '#FDE68A',
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 12,
                marginBottom: 12,
                flexDirection: 'row',
                gap: 10,
              }}
            >
              <Icon name="shield-alert" size={18} color={isDark ? '#FCD34D' : '#92400E'} strokeWidth={1.8} />
              <Text style={{ flex: 1, fontSize: 13, color: isDark ? '#FCD34D' : '#92400E', lineHeight: 18 }}>
                Ton document <Text style={{ fontWeight: '700' }}>{s.earliestExpiringAlert.docLabel}</Text>{' '}
                expire dans {s.earliestExpiringAlert.daysLeft} jour
                {s.earliestExpiringAlert.daysLeft > 1 ? 's' : ''}.
              </Text>
            </View>
          )}

          {errorMessage && (
            <View
              style={{
                backgroundColor: colors.dangerSoft,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: colors.danger, fontSize: 12 }}>{errorMessage}</Text>
            </View>
          )}

          <DocSection
            title="Obligatoires"
            rows={s.mandatory}
            uploadingType={upload.uploadingType}
            onPress={upload.pickAndUpload}
          />
          <DocSection
            title="Optionnels"
            rows={s.optional}
            uploadingType={upload.uploadingType}
            onPress={upload.pickAndUpload}
          />

          <View
            style={{
              flexDirection: 'row',
              gap: 8,
              backgroundColor: colors.surfaceMuted,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: 10,
              marginTop: 16,
            }}
          >
            <Icon name="info" size={16} color={colors.inkMuted} strokeWidth={2} />
            <Text style={{ flex: 1, fontSize: 12, color: colors.inkMuted, lineHeight: 16 }}>
              Appuie sur un document pour téléverser un fichier (PDF, JPG, PNG · 10 Mo max). Les
              documents sont vérifiés sous 24-48 h ouvrées.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function DocSection({
  title,
  rows,
  uploadingType,
  onPress,
}: {
  title: string;
  rows: DocumentRowData[];
  uploadingType: string | null;
  onPress: (type: string) => void;
}) {
  const { colors } = useTheme();
  if (rows.length === 0) return null;
  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          color: colors.inkSoft,
          paddingHorizontal: 4,
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      <View style={{ gap: 8 }}>
        {rows.map((r) => (
          <DocumentRow
            key={r.type}
            label={r.label}
            status={r.status}
            expiryLabel={r.expiryLabel}
            cta={r.cta}
            uploading={uploadingType === r.type}
            onPress={() => onPress(r.type)}
          />
        ))}
      </View>
    </View>
  );
}
