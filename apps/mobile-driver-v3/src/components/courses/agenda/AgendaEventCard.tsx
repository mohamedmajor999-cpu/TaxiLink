import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';
import type { AgendaEvent } from './agendaHelpers';

interface Props {
  event: AgendaEvent;
  onTap: () => void;
  onMenu?: () => void;
}

const fmt = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

// Réplique apps/web/.../AgendaEventCard.tsx en RN.
// Variante "block" (course manuelle départ = arrivée → indisponibilité) jaune.
// Variante "course" : fond paper + badge type CPAM (bleu) / Privé (violet) / TaxiLink (vert).
export function AgendaEventCard({ event, onTap, onMenu }: Props) {
  const { colors, isDark } = useTheme();
  const timeRange = `${fmt(event.start)} — ${fmt(event.end)}`;
  const isBlock = event.isManual && event.from === event.to;

  if (isBlock) {
    // Indispo : carte amber. Dark mode = bg amber sombre.
    const amberBg = isDark ? '#2B1F08' : '#FEF3C7';
    const amberBorder = isDark ? '#7C4A18' : '#FDE68A';
    const amberInk = isDark ? '#FCD34D' : '#B45309';
    return (
      <CardWrapper onTap={onTap} onMenu={onMenu} bg={amberBg} border={amberBorder}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>{timeRange}</Text>
          <Text style={{ fontSize: 12, fontWeight: '900', color: amberInk, letterSpacing: 0.4 }}>
            INDISPONIBLE
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="user" size={13} color={colors.inkMuted} strokeWidth={1.8} />
          <Text numberOfLines={1} style={{ fontSize: 13, color: colors.inkMuted, fontWeight: '500', flexShrink: 1 }}>
            {event.from}
          </Text>
        </View>
      </CardWrapper>
    );
  }

  const isCpam = event.type === 'CPAM';
  const typeLabel = isCpam ? 'CPAM' : event.type === 'TAXILINK' ? 'TaxiLink' : 'Privé';
  // CPAM = accent bleu, TaxiLink = success vert, Privé = violet (couleur tag distinctive).
  const typeColor = isCpam
    ? colors.accent
    : event.type === 'TAXILINK'
      ? colors.success
      : (isDark ? '#C084FC' : '#6B21A8');
  const fromShort = event.from.split(',')[0];
  const toShort = event.to.split(',')[0];
  const route = `${fromShort} — ${toShort}`;
  const meta = [
    event.returnTrip ? 'A/R' : null,
    event.priceEur > 0 ? `${event.priceEur.toFixed(2).replace('.', ',')} €` : null,
  ].filter(Boolean).join(' · ');

  return (
    <CardWrapper onTap={onTap} onMenu={onMenu} bg={colors.surface} border={colors.border}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>{timeRange}</Text>
        <Text style={{ fontSize: 11, fontWeight: '900', color: typeColor, letterSpacing: 0.4 }}>
          {typeLabel.toUpperCase()}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name="user" size={13} color={colors.inkMuted} strokeWidth={1.8} />
        <Text numberOfLines={1} style={{ fontSize: 13, color: colors.inkMuted, fontWeight: '500', flexShrink: 1 }}>
          {event.patientName ? `${event.patientName} · ${route}` : route}
        </Text>
      </View>
      {meta.length > 0 && (
        <Text style={{ fontSize: 12, color: colors.inkSoft, marginTop: 4 }}>{meta}</Text>
      )}
    </CardWrapper>
  );
}

interface WrapperProps {
  bg: string;
  border: string;
  onTap: () => void;
  onMenu?: () => void;
  children: ReactNode;
}

function CardWrapper({ bg, border, onTap, onMenu, children }: WrapperProps) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={{
        position: 'relative',
        borderRadius: 14,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={onTap}
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
        style={{ padding: 14, paddingRight: onMenu ? 44 : 14 }}
      >
        {children}
      </Pressable>
      {onMenu && (
        <View style={{ position: 'absolute', top: 6, right: 6, width: 36, height: 36, borderRadius: 10, overflow: 'hidden' }}>
          <Pressable
            onPress={onMenu}
            android_ripple={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
            accessibilityLabel="Actions"
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.inkMuted, lineHeight: 18 }}>⋮</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
