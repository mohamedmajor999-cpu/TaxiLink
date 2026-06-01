import { Component, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { captureException } from '@/lib/sentry';
import { useTheme } from '@/lib/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// RES-03 (audit experience VTC) : filet anti-ecran-blanc. Sans ErrorBoundary,
// une erreur de rendu (ex: un champ null inattendu) tue toute l'app sur un ecran
// blanc — au pire pendant une course. Ici on capture l'erreur (Sentry) et on
// affiche un fallback themable avec un bouton "Recharger" qui re-monte l'arbre.
export class AppErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown): void {
    captureException(error, { tags: { phase: 'react-error-boundary' } });
  }

  reset = (): void => {
    this.setState({ hasError: false });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      return <ErrorFallback onReset={this.reset} />;
    }
    return this.props.children;
  }
}

// Fallback fonctionnel (useTheme) — rendu DANS le ThemeProvider, donc le thème
// est dispo ; si le contexte est inaccessible, useTheme renvoie le défaut clair.
function ErrorFallback({ onReset }: { onReset: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16, backgroundColor: colors.bg }}>
      <Text style={{ fontSize: 44 }}>😕</Text>
      <Text style={{ fontSize: 19, fontWeight: '800', color: colors.ink, textAlign: 'center' }}>
        Une erreur est survenue
      </Text>
      <Text style={{ fontSize: 14, fontWeight: '500', color: colors.inkMuted, textAlign: 'center', lineHeight: 20 }}>
        L'application a rencontré un problème sur cet écran. Recharge pour continuer — tes données ne sont pas perdues.
      </Text>
      <View style={{ marginTop: 8, borderRadius: 14, backgroundColor: colors.brand, overflow: 'hidden' }}>
        <Pressable
          onPress={onReset}
          android_ripple={{ color: 'rgba(0,0,0,0.12)' }}
          accessibilityRole="button"
          accessibilityLabel="Recharger l'écran"
          style={{ paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 16, fontWeight: '800', color: colors.brandInk }}>Recharger</Text>
        </Pressable>
      </View>
    </View>
  );
}
