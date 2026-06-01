import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icons/Icon';
import { ProfileSubHeader } from '@/components/profil/ProfileSubHeader';
import { useTheme } from '@/lib/theme';

const SUPPORT_EMAIL = 'support@taxilink.fr';
const SUPPORT_PHONE = '+33 1 23 45 67 89';
const WHATSAPP_NUMBER = '33123456789';

interface FaqItem {
  q: string;
  a: string;
}

const FAQ: FaqItem[] = [
  {
    q: 'Comment recevoir des missions ?',
    a: "Active ton statut « En ligne » depuis l'écran d'accueil et déclare au moins un département dans Profil → Départements couverts. Les missions visibles correspondent à tes zones d'activité.",
  },
  {
    q: 'Quand suis-je payé après une course ?',
    a: 'Les courses CPAM sont versées sous 7 jours ouvrés après validation. Les courses privées sont créditées sous 48 h sur le compte enregistré dans Profil → Compte bancaire.',
  },
  {
    q: 'Comment télécharger un reçu de course ?',
    a: 'Ouvre Profil → Factures & reçus, sélectionne la course concernée puis appuie sur « Imprimer / PDF ».',
  },
  {
    q: 'Mon document expire bientôt, que faire ?',
    a: "Va dans Profil → Documents pour vérifier les statuts. L'envoi de nouveaux documents se fait pour le moment depuis la version web.",
  },
  {
    q: 'Comment partager une mission avec un autre chauffeur ?',
    a: "Depuis l'écran d'accueil, ouvre la course puis appuie sur « Partager ». Tu peux la diffuser à un ou plusieurs de tes groupes, ou en public.",
  },
  {
    q: 'Comment changer mon IBAN ?',
    a: 'Ouvre Profil → Compte bancaire, saisis le nouvel IBAN et enregistre. La clé de contrôle est vérifiée immédiatement.',
  },
];

export default function SupportRoute() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const { colors } = useTheme();

  function open(url: string) {
    Linking.openURL(url).catch(() => {
      // Sur Android, certains schemes peuvent ne pas être supportés (pas
      // d'app email, etc.) : silencieux pour ne pas crasher.
    });
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ProfileSubHeader title="Aide & support" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
      >
        <SectionTitle>Nous contacter</SectionTitle>
        <View style={{ gap: 8, marginBottom: 20 }}>
          <ContactRow
            icon="mail"
            label="Email"
            value={SUPPORT_EMAIL}
            onPress={() => open(`mailto:${SUPPORT_EMAIL}?subject=Aide%20TaxiLink`)}
          />
          <ContactRow
            icon="phone"
            label="Téléphone"
            value={SUPPORT_PHONE}
            description="Lun–ven · 9 h–18 h"
            onPress={() => open(`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`)}
          />
          <ContactRow
            icon="message-circle"
            label="WhatsApp"
            value="Réponse en moins d'une heure"
            onPress={() => open(`https://wa.me/${WHATSAPP_NUMBER}`)}
          />
        </View>

        <SectionTitle>Questions fréquentes</SectionTitle>
        <View style={{ gap: 8 }}>
          {FAQ.map((item, idx) => {
            const open = openIdx === idx;
            return (
              <View
                key={item.q}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 16,
                  overflow: 'hidden',
                }}
              >
                <Pressable
                  onPress={() => setOpenIdx(open ? null : idx)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
                  })}
                >
                  <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: colors.ink, lineHeight: 18 }}>
                    {item.q}
                  </Text>
                  <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
                    <Icon name="chevron-down" size={16} color={colors.inkSoft} strokeWidth={2} />
                  </View>
                </Pressable>
                {open && (
                  <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
                    <Text style={{ fontSize: 12.5, color: colors.inkMuted, lineHeight: 18 }}>{item.a}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
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
      {children}
    </Text>
  );
}

function ContactRow({
  icon,
  label,
  value,
  description,
  onPress,
}: {
  icon: IconName;
  label: string;
  value: string;
  description?: string;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="link"
        accessibilityLabel={`${label} ${value}`}
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: colors.pillBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={18} color={colors.ink} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink, lineHeight: 18 }}>{label}</Text>
          <Text numberOfLines={1} style={{ fontSize: 12, color: colors.inkMuted, marginTop: 2 }}>
            {value}
          </Text>
          {description && (
            <Text style={{ fontSize: 11, color: colors.inkSoft, marginTop: 1 }}>{description}</Text>
          )}
        </View>
      </Pressable>
    </View>
  );
}
