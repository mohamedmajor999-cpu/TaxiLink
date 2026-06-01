import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import type { Mission } from '@taxilink/supabase-types';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

interface Props {
  visible: boolean;
  mission: Mission | null;
  onClose: () => void;
  onEdit?: (mission: Mission) => void;
  // Masque l'entree "Modifier la course" (ex: ecran de course en cours, ou
  // l'edition n'a pas de sens). Defaut: affichee.
  showEdit?: boolean;
  onCancel: (mission: Mission, reason: string) => Promise<void> | void;
  onNoShow: (mission: Mission, reason: string) => Promise<void> | void;
}

type Phase = 'menu' | 'noShow' | 'cancel';

// Mirror de apps/web/.../CourseActionsMenu.tsx + ReasonDialog.tsx en RN.
// Etape 1 = menu kebab (3 actions). Etape 2 = liste des motifs (Modal custom,
// PAS Alert.alert : sur Android Alert plafonne a 3 boutons, les 5 motifs +
// Annuler n'auraient jamais ete tous affiches).
export function CourseActionsMenu({ visible, mission, onClose, onEdit, showEdit = true, onCancel, onNoShow }: Props) {
  const { colors, isDark } = useTheme();
  const [phase, setPhase] = useState<Phase>('menu');

  // Reset phase au menu chaque fois qu'on rouvre. Sans ca, l'utilisateur qui
  // ferme la modale alors qu'il etait sur la liste des motifs retomberait
  // dessus a la prochaine ouverture.
  useEffect(() => {
    if (visible) setPhase('menu');
  }, [visible]);

  if (!mission) return null;
  const m = mission;

  const handleEdit = () => {
    onClose();
    onEdit?.(m);
  };

  const handlePickNoShow = (reason: string) => {
    onClose();
    void onNoShow(m, reason);
  };

  const handlePickCancel = (reason: string) => {
    onClose();
    void onCancel(m, reason);
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.35)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 340,
            borderRadius: 14,
            backgroundColor: colors.surfaceElevated,
            paddingVertical: 6,
            shadowColor: '#000',
            shadowOpacity: isDark ? 0.55 : 0.18,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 12 },
            elevation: 12,
          }}
        >
          {phase === 'menu' && (
            <>
              {showEdit && onEdit && (
                <>
                  <MenuItem icon="pencil" label="Modifier la course" onPress={handleEdit} />
                  <Separator />
                </>
              )}
              <MenuItem icon="ban" label="Client absent" onPress={() => setPhase('noShow')} />
              <MenuItem icon="x" label="Annuler la course" onPress={() => setPhase('cancel')} danger />
            </>
          )}
          {phase === 'noShow' && (
            <ReasonList
              title="Client absent"
              subtitle="La course sera cloturee mais ne comptera pas dans ton CA."
              reasons={NO_SHOW_REASONS}
              danger={false}
              onPick={handlePickNoShow}
              onBack={() => setPhase('menu')}
            />
          )}
          {phase === 'cancel' && (
            <ReasonList
              title="Annuler la course"
              subtitle="La course sera remise dans le pool. Choisis un motif."
              reasons={CANCEL_REASONS}
              danger
              onPick={handlePickCancel}
              onBack={() => setPhase('menu')}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Separator() {
  const { colors } = useTheme();
  return <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 12 }} />;
}

function MenuItem({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: 'pencil' | 'ban' | 'x';
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const color = danger ? colors.danger : colors.ink;
  return (
    <View style={{ borderRadius: 10, marginHorizontal: 6, overflow: 'hidden' }}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: danger ? 'rgba(220,38,38,0.08)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)') }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 12,
          paddingVertical: 14,
        }}
      >
        <Icon name={icon} size={16} color={danger ? colors.danger : colors.inkMuted} strokeWidth={1.8} />
        <Text style={{ fontSize: 14, fontWeight: '600', color }}>{label}</Text>
      </Pressable>
    </View>
  );
}

interface ReasonOption {
  key: string;
  label: string;
}

function ReasonList({
  title,
  subtitle,
  reasons,
  danger,
  onPick,
  onBack,
}: {
  title: string;
  subtitle: string;
  reasons: ReadonlyArray<ReasonOption>;
  danger: boolean;
  onPick: (reasonLabel: string) => void;
  onBack: () => void;
}) {
  const { colors, isDark } = useTheme();
  return (
    <View>
      {/* Header : titre + back chevron */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8, gap: 8 }}>
        <View style={{ width: 32, height: 32, borderRadius: 8, overflow: 'hidden' }}>
          <Pressable
            onPress={onBack}
            android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
            accessibilityLabel="Retour au menu"
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.ink, lineHeight: 22 }}>‹</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: colors.ink }}>{title}</Text>
          {subtitle ? (
            <Text style={{ fontSize: 12, color: colors.inkMuted, marginTop: 2, lineHeight: 16 }}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      <Separator />
      {/* Liste des motifs */}
      <View style={{ paddingVertical: 4 }}>
        {reasons.map((r) => (
          <ReasonItem key={r.key} label={r.label} danger={danger} onPress={() => onPick(r.label)} />
        ))}
      </View>
    </View>
  );
}

function ReasonItem({ label, onPress, danger }: { label: string; onPress: () => void; danger: boolean }) {
  const { colors, isDark } = useTheme();
  return (
    <View style={{ borderRadius: 10, marginHorizontal: 6, overflow: 'hidden' }}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: danger ? 'rgba(220,38,38,0.08)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)') }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 13,
        }}
      >
        <Text style={{ flex: 1, fontSize: 13.5, fontWeight: '600', color: danger ? colors.danger : colors.ink }}>
          {label}
        </Text>
        <Text style={{ fontSize: 16, color: colors.inkSoft, lineHeight: 16 }}>›</Text>
      </Pressable>
    </View>
  );
}

// Mirror des constantes apps/web/.../course/ReasonDialog.tsx
const CANCEL_REASONS: ReadonlyArray<ReasonOption> = [
  { key: 'delay', label: 'Retard important' },
  { key: 'vehicle', label: 'Vehicule immobilise' },
  { key: 'personal', label: 'Urgence personnelle' },
  { key: 'address', label: 'Adresse introuvable' },
  { key: 'other', label: 'Autre' },
];

const NO_SHOW_REASONS: ReadonlyArray<ReasonOption> = [
  { key: 'absent', label: 'Patient absent au point de RDV' },
  { key: 'refused', label: 'Patient refuse de monter' },
  { key: 'wrong_address', label: 'Adresse introuvable / erronee' },
  { key: 'other_taxi', label: 'Patient deja parti (autre taxi)' },
  { key: 'other', label: 'Autre' },
];
