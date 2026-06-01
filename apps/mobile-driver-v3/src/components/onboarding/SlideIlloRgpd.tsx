import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

// 3 piliers de confiance (RGPD / France / Pseudo). Remplace l'ancien bouclier
// SVG geant — meme intention mais plus parlant : 3 promesses concretes,
// theme clair pour rester coherent avec les autres slides onboarding.
export function SlideIlloRgpd() {
  return (
    <View style={{ width: '100%', maxWidth: 340, gap: 10 }}>
      <Pillar icon={<ShieldIcon />} title="100% RGPD" subtitle="Conforme CNIL" />
      <Pillar icon={<FlagIcon />} title="Données en France" subtitle="Hébergées chez OVH · Souverain" />
      <Pillar icon={<LockIcon />} title="Pseudonymisé" subtitle="Codes d'invitation expirants" />
    </View>
  );
}

function Pillar({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        backgroundColor: '#FAFAF9',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: '#FFD11A',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: '#000' }}>{title}</Text>
        <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{subtitle}</Text>
      </View>
    </View>
  );
}

function ShieldIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke="#000" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path d="M9 12l2 2 4-4" stroke="#000" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FlagIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={6} height={16} fill="#0055A4" />
      <Rect x={9} y={4} width={6} height={16} fill="#FFFFFF" stroke="#000" strokeWidth={0.5} />
      <Rect x={15} y={4} width={6} height={16} fill="#EF4135" />
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={11} width={18} height={11} rx={2} stroke="#000" strokeWidth={2.5} />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#000" strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}
