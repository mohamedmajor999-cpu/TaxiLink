import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useNightModeStore, nightModeActive } from '@taxilink/stores';

export type ThemeMode = 'light' | 'dark';

export interface ThemePalette {
  bg: string;
  surface: string;
  surfaceMuted: string;
  surfaceElevated: string;
  border: string;
  borderSoft: string;
  ink: string;
  inkMuted: string;
  inkSoft: string;
  brand: string;
  brandInk: string;
  accent: string;
  accentSoft: string;
  danger: string;
  dangerSoft: string;
  success: string;
  pillBg: string;
  shadow: string;
  // Map tiles (Mapbox style id ou OSM fallback geree cote leafletHtml)
  mapStyleStreets: 'streets-v12' | 'dark-v11' | 'navigation-night-v1';
}

const LIGHT: ThemePalette = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F7F5EF',
  surfaceElevated: '#FFFFFF',
  border: '#E8E6DF',
  borderSoft: '#F1EFE8',
  ink: '#000000',
  inkMuted: '#5F5E5A',
  inkSoft: '#888780',
  brand: '#FFD11A',
  brandInk: '#1A1A1A',
  accent: '#3B82F6',
  accentSoft: '#DBEAFE',
  danger: '#A32D2D',
  dangerSoft: '#FCEBEB',
  success: '#16A34A',
  pillBg: '#F1EFE8',
  shadow: 'rgba(0,0,0,0.15)',
  mapStyleStreets: 'streets-v12',
};

// Tesla Model S Night Mode (v3, ajustee 2026-05-15 apres retour "trop sombre") :
// palette gris-bleu chaleureuse, plus claire que le Driver Display strict.
// Confort visuel privilegie sur le contraste maxi — c'est de la conduite
// reelle, pas un theme demo.
//
// Echelle (du fond au plus eleve) :
//   bg              #2A2F38 — gris-bleu confortable (anciennement #1B1F26 trop sombre)
//   surfaceMuted    #313742 — zone sourde
//   surface         #353B47 — card standard
//   surfaceElevated #434957 — card flottante (top bar, controls, popup)
//
// Bordures #555C6B : tres visibles, donnent des contours nets meme sans
// shadow visible sur fond sombre.
//
// Texte : blanc pur #FFFFFF primary, #D1D5DD secondaire, #A0A6B1 hints
// (tous au-dessus de WCAG AA sur les surfaces de cette palette).
const DARK: ThemePalette = {
  bg: '#2A2F38',
  surface: '#353B47',
  surfaceMuted: '#313742',
  surfaceElevated: '#434957',
  border: '#555C6B',
  borderSoft: '#3D434F',
  ink: '#FFFFFF',
  inkMuted: '#D1D5DD',
  inkSoft: '#A0A6B1',
  // Mode nuit : le brand jaune (#FFD11A) bascule sur le bleu accent (#3B82F6)
  // pour tout ce qui utilise colors.brand (logos, étoiles favoris, badges,
  // numéros sur la pulse). brandInk = blanc pour rester lisible sur fond bleu.
  // EXCEPTION : l'icône éclair (zap) du bandeau pulse est forcée en jaune
  // hardcodé (#FFD11A) pour préserver le signal "live" iconique.
  brand: '#3B82F6',
  brandInk: '#FFFFFF',
  accent: '#3B82F6',
  accentSoft: '#1E3A8A',
  danger: '#F87171',
  dangerSoft: '#4A1F1F',
  success: '#34D399',
  pillBg: '#434957',
  shadow: 'rgba(0,0,0,0.5)',
  // navigation-night-v1 : style Mapbox conduite nuit, plus lumineux que
  // dark-v11. Les routes secondaires ressortent, les noms de villes/
  // quartiers sont lisibles sans plisser les yeux.
  mapStyleStreets: 'navigation-night-v1',
};

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemePalette;
  isDark: boolean;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  colors: LIGHT,
  isDark: false,
  setMode: () => {},
  toggle: () => {},
});

// Provider monte au tout premier _layout root. Source unique de verite =
// nightModeStore (Zustand persiste cross-platform via AsyncStorage). Le
// store rehydratant en async, le 1er render tombe en light puis bascule
// en dark des l'hydratation — invisible a l'oeil nu (<50ms).
//
// IMPORTANT — Pas d'effet de bord système au toggle. On NE déclenche PAS :
//   - `Appearance.setColorScheme(mode)` → Configuration change Android →
//     propage de nouveaux insets → onLayout du conteneur interne gorhom →
//     `setToPosition(proposedPosition)` synchrone (state interne, hors API
//     publique) → décale visiblement le bottom sheet à chaque toggle.
//   - `NavigationBar.setBackgroundColorAsync` / `setButtonStyleAsync` →
//     même cascade sur One UI.
// Les consommateurs qui ont besoin du thème reçoivent un signal direct :
//   - StatusBar style : piloté via prop explicite au root layout (cf.
//     `_layout.tsx` → `<StatusBar style={isDark ? 'light' : 'dark'} />`)
//   - WebView Leaflet : `window.tlSetTheme` injectJavaScript (cf. MissionMap)
//   - Composants RN : `useTheme()` direct via Context
export function ThemeProvider({ children }: { children: ReactNode }) {
  const pref = useNightModeStore((s) => s.pref);
  const setPref = useNightModeStore((s) => s.setPref);
  const togglePref = useNightModeStore((s) => s.toggle);

  const isDark = nightModeActive(pref);
  const mode: ThemeMode = isDark ? 'dark' : 'light';

  const setMode = useCallback(
    (m: ThemeMode) => setPref(m === 'dark' ? 'on' : 'off'),
    [setPref],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      colors: isDark ? DARK : LIGHT,
      isDark,
      setMode,
      toggle: togglePref,
    }),
    [mode, isDark, setMode, togglePref],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
