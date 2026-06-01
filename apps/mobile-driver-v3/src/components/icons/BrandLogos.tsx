import Svg, { Circle, Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

// Logo WhatsApp officiel (silhouette téléphone dans bulle de chat). Le path
// vient du logo SVG officiel WhatsApp. Couleur via prop pour usage sur fond
// vert WhatsApp (#25D366) en blanc, ou inversé.
export function WhatsAppLogo({ size = 16, color = '#FFFFFF' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.2-.7.2-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4 0 1.4 1 2.7 1.2 2.9.1.2 2 3 4.8 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4 0-.1-.2-.2-.5-.4zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.4 1.3 4.9L2 22l5.3-1.4c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
    </Svg>
  );
}

// Logo Google Maps : pin "teardrop" multicolore (rouge/jaune/vert/bleu) + dot blanc.
// Vectorisation simplifiée du logo officiel Google Maps app icon.
export function GoogleMapsLogo({ size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Pin teardrop : segments colorisés autour du point central */}
      {/* Rouge (haut) */}
      <Path d="M12 2 C7.58 2 4 5.58 4 10 c0 1.5 0.4 2.9 1.1 4.1 L12 12 z" fill="#EA4335" />
      {/* Jaune (droite) */}
      <Path d="M20 10 C20 5.58 16.42 2 12 2 v10 z" fill="#FBBC04" />
      {/* Vert (bas droit) */}
      <Path d="M20 10 c0 1.5-0.4 2.9-1.1 4.1 L12 22 V12 z" fill="#34A853" />
      {/* Bleu (bas gauche) */}
      <Path d="M5.1 14.1 L12 22 V12 z" fill="#4285F4" />
      {/* Cercle blanc central */}
      <Circle cx="12" cy="10" r="3" fill="#FFFFFF" />
    </Svg>
  );
}

// Logo Waze : speech-bubble cyan + 2 yeux noirs + bouche.
// Vectorisation simplifiée du logo Waze app icon (mascotte "Waze guy").
export function WazeLogo({ size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Bulle cyan : forme speech bubble arrondie + petite queue en bas-gauche */}
      <Path
        d="M12 2 C6.48 2 2 6.04 2 11 c0 2.4 1.05 4.58 2.77 6.2 l-1.1 2.4 c-0.18 0.4 0.27 0.79 0.65 0.56 L7.6 18.4 c1.32 0.62 2.83 0.97 4.4 0.97 5.52 0 10-4.04 10-9 S17.52 2 12 2 z"
        fill="#33CCFF"
      />
      {/* Œil gauche */}
      <Circle cx="9" cy="10.5" r="1.1" fill="#0F0F0F" />
      {/* Œil droit */}
      <Circle cx="15" cy="10.5" r="1.1" fill="#0F0F0F" />
      {/* Sourire */}
      <Path
        d="M9 13.5 C9.7 14.5 10.8 15 12 15 c1.2 0 2.3-0.5 3-1.5"
        stroke="#0F0F0F"
        strokeWidth={1.4}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}
