import { ActivityIndicator, Text, View } from 'react-native';

import { GpsPrefRow } from './GpsPrefRow';
import { GreenSwitch } from './GreenSwitch';
import { ProfileMenuRow } from './ProfileMenuRow';
import { ProfileSection } from './ProfileSection';
import { ThemeModeRow } from './ThemeModeRow';
import { useProfileSectionApp } from './useProfileSectionApp';
import { useTheme } from '@/lib/theme';

interface Props {
  loggingOut: boolean;
  onOpenSupport?: () => void;
  onLogout: () => void;
}

export function ProfileSectionApp({ loggingOut, onOpenSupport, onLogout }: Props) {
  const a = useProfileSectionApp();
  const { colors } = useTheme();

  return (
    <ProfileSection title="Application">
      <ProfileMenuRow
        icon="bell-ring"
        label="Alertes nouvelles courses"
        description="Popup quand une course proche est postée"
        right={
          <GreenSwitch
            accessibilityLabel="Alertes nouvelles courses"
            checked={a.popupNewMission}
            onChange={(v) => {
              a.setPopupNewMission(v);
            }}
          />
        }
      />
      <ProfileMenuRow
        icon="map-pin"
        label="Partager ma position en ligne"
        description="Pour recevoir les courses proches de toi (RGPD)"
        right={
          <GreenSwitch
            accessibilityLabel="Position GPS"
            checked={a.geolocPushEnabled}
            onChange={(v) => {
              a.setGeolocPushEnabled(v);
            }}
          />
        }
      />
      <ThemeModeRow pref={a.themePref} onChange={a.setThemePref} />
      <GpsPrefRow value={a.gpsPref} onChange={a.setGpsPref} />
      <ProfileMenuRow icon="help-circle" label="Aide & support" onPress={onOpenSupport} />
      <ProfileMenuRow
        tone="danger"
        icon="logout"
        label={loggingOut ? 'Déconnexion…' : 'Se déconnecter'}
        onPress={loggingOut ? undefined : onLogout}
        right={
          loggingOut ? (
            <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="small" color={colors.danger} />
            </View>
          ) : undefined
        }
        disabled={loggingOut}
      />
      {a.error && (
        <View
          style={{
            backgroundColor: colors.dangerSoft,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: colors.danger, fontSize: 12 }}>{a.error}</Text>
        </View>
      )}
    </ProfileSection>
  );
}
