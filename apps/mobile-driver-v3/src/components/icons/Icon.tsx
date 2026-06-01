import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

// Icônes Lucide minimales en SVG inline (réutilise react-native-svg déjà installé,
// évite d'ajouter une dépendance lucide-react-native). Chemins copiés depuis
// lucide.dev v0.x — ne nécessitent pas de mise à jour.
export type IconName = 'menu' | 'sun' | 'moon' | 'map-pin' | 'zap' | 'plus' | 'minus' | 'chevron-down' | 'chevron-right' | 'layers' | 'fullscreen' | 'locate' | 'route' | 'megaphone' | 'home' | 'list' | 'users' | 'user' | 'logout' | 'x' | 'lock' | 'calendar' | 'clock' | 'stethoscope' | 'folder' | 'ban' | 'pencil' | 'help-circle' | 'download' | 'trash' | 'bell-ring' | 'arrow-left' | 'arrow-right' | 'shield-alert' | 'check' | 'phone' | 'mic' | 'globe' | 'briefcase' | 'briefcase-medical' | 'building' | 'car' | 'users-plus' | 'message-circle' | 'message-square' | 'mail' | 'info' | 'shield-off' | 'navigation' | 'link' | 'search' | 'copy' | 'share-2' | 'trending-up' | 'thumbs-up';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  // Couleur de remplissage interieur. Defaut 'none' (icone Lucide stroke-only).
  // Permet le pattern "trait noir + interieur jaune" sur la BottomNav active.
  fill?: string;
}

export function Icon({ name, size = 18, color = '#0F0F0F', strokeWidth = 2, fill = 'none' }: Props) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill };
  const stroke = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill };

  switch (name) {
    case 'menu':
      return (
        <Svg {...common}>
          <Line x1="4" y1="6" x2="20" y2="6" {...stroke} />
          <Line x1="4" y1="12" x2="20" y2="12" {...stroke} />
          <Line x1="4" y1="18" x2="20" y2="18" {...stroke} />
        </Svg>
      );
    case 'sun':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="4" {...stroke} />
          <Line x1="12" y1="2" x2="12" y2="4" {...stroke} />
          <Line x1="12" y1="20" x2="12" y2="22" {...stroke} />
          <Line x1="4.93" y1="4.93" x2="6.34" y2="6.34" {...stroke} />
          <Line x1="17.66" y1="17.66" x2="19.07" y2="19.07" {...stroke} />
          <Line x1="2" y1="12" x2="4" y2="12" {...stroke} />
          <Line x1="20" y1="12" x2="22" y2="12" {...stroke} />
          <Line x1="4.93" y1="19.07" x2="6.34" y2="17.66" {...stroke} />
          <Line x1="17.66" y1="6.34" x2="19.07" y2="4.93" {...stroke} />
        </Svg>
      );
    case 'moon':
      return (
        <Svg {...common}>
          <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" {...stroke} />
        </Svg>
      );
    case 'map-pin':
      return (
        <Svg {...common}>
          <Path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0 1 16 0z" {...stroke} />
          <Circle cx="12" cy="10" r="3" {...stroke} />
        </Svg>
      );
    case 'zap':
      return (
        <Svg {...common}>
          <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill={color} />
        </Svg>
      );
    case 'plus':
      return (
        <Svg {...common}>
          <Line x1="12" y1="5" x2="12" y2="19" {...stroke} />
          <Line x1="5" y1="12" x2="19" y2="12" {...stroke} />
        </Svg>
      );
    case 'chevron-down':
      return (
        <Svg {...common}>
          <Path d="M6 9l6 6 6-6" {...stroke} />
        </Svg>
      );
    case 'minus':
      return (
        <Svg {...common}>
          <Line x1="5" y1="12" x2="19" y2="12" {...stroke} />
        </Svg>
      );
    case 'layers':
      return (
        <Svg {...common}>
          <Path d="M12 2L2 7l10 5 10-5-10-5z" {...stroke} />
          <Path d="M2 17l10 5 10-5" {...stroke} />
          <Path d="M2 12l10 5 10-5" {...stroke} />
        </Svg>
      );
    case 'fullscreen':
      return (
        <Svg {...common}>
          <Path d="M8 3H5a2 2 0 0 0-2 2v3" {...stroke} />
          <Path d="M21 8V5a2 2 0 0 0-2-2h-3" {...stroke} />
          <Path d="M3 16v3a2 2 0 0 0 2 2h3" {...stroke} />
          <Path d="M16 21h3a2 2 0 0 0 2-2v-3" {...stroke} />
        </Svg>
      );
    case 'locate':
      return (
        <Svg {...common}>
          <Line x1="2" y1="12" x2="5" y2="12" {...stroke} />
          <Line x1="19" y1="12" x2="22" y2="12" {...stroke} />
          <Line x1="12" y1="2" x2="12" y2="5" {...stroke} />
          <Line x1="12" y1="19" x2="12" y2="22" {...stroke} />
          <Circle cx="12" cy="12" r="7" {...stroke} />
          <Circle cx="12" cy="12" r="2.5" fill={color} />
        </Svg>
      );
    case 'route':
      return (
        <Svg {...common}>
          <Circle cx="6" cy="19" r="3" {...stroke} />
          <Path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" {...stroke} />
          <Circle cx="18" cy="5" r="3" {...stroke} />
        </Svg>
      );
    case 'megaphone':
      return (
        <Svg {...common}>
          <Path d="m3 11 18-5v12L3 14v-3z" {...stroke} />
          <Path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" {...stroke} />
        </Svg>
      );
    case 'home':
      return (
        <Svg {...common}>
          <Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" {...stroke} />
          <Path d="M9 22V12h6v10" {...stroke} />
        </Svg>
      );
    case 'list':
      // Rectangles arrondis : interieur fillable. Heights/stroke ajustes pour
      // que le fill jaune (tab active) soit reellement visible. Avant : height
      // 1.5 + stroke 1.44 = 0.06px d'interieur visible → fill invisible.
      // Maintenant : height 3.5 + stroke 1 = 2.5px d'interieur jaune.
      return (
        <Svg {...common}>
          <Rect x="2" y="4.25" width="3.5" height="3.5" rx="1.75" stroke={color} strokeWidth={1} fill={fill} />
          <Rect x="2" y="10.25" width="3.5" height="3.5" rx="1.75" stroke={color} strokeWidth={1} fill={fill} />
          <Rect x="2" y="16.25" width="3.5" height="3.5" rx="1.75" stroke={color} strokeWidth={1} fill={fill} />
          <Rect x="7.5" y="4.25" width="14" height="3.5" rx="1.75" stroke={color} strokeWidth={1} fill={fill} />
          <Rect x="7.5" y="10.25" width="14" height="3.5" rx="1.75" stroke={color} strokeWidth={1} fill={fill} />
          <Rect x="7.5" y="16.25" width="14" height="3.5" rx="1.75" stroke={color} strokeWidth={1} fill={fill} />
        </Svg>
      );
    case 'users':
      return (
        <Svg {...common}>
          <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" {...stroke} />
          <Circle cx="9" cy="7" r="4" {...stroke} />
          <Path d="M22 21v-2a4 4 0 0 0-3-3.87" {...stroke} />
          <Path d="M16 3.13a4 4 0 0 1 0 7.75" {...stroke} />
        </Svg>
      );
    case 'user':
      return (
        <Svg {...common}>
          <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" {...stroke} />
          <Circle cx="12" cy="7" r="4" {...stroke} />
        </Svg>
      );
    case 'logout':
      return (
        <Svg {...common}>
          <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" {...stroke} />
          <Path d="m16 17 5-5-5-5" {...stroke} />
          <Line x1="21" y1="12" x2="9" y2="12" {...stroke} />
        </Svg>
      );
    case 'x':
      return (
        <Svg {...common}>
          <Line x1="18" y1="6" x2="6" y2="18" {...stroke} />
          <Line x1="6" y1="6" x2="18" y2="18" {...stroke} />
        </Svg>
      );
    case 'lock':
      return (
        <Svg {...common}>
          <Path d="M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z" {...stroke} />
          <Path d="M7 11V7a5 5 0 0 1 10 0v4" {...stroke} />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg {...common}>
          <Path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" {...stroke} />
          <Line x1="16" y1="2" x2="16" y2="6" {...stroke} />
          <Line x1="8" y1="2" x2="8" y2="6" {...stroke} />
          <Line x1="3" y1="10" x2="21" y2="10" {...stroke} />
        </Svg>
      );
    case 'clock':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="10" {...stroke} />
          <Path d="M12 6v6l4 2" {...stroke} />
        </Svg>
      );
    case 'stethoscope':
      return (
        <Svg {...common}>
          <Path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" {...stroke} />
          <Path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" {...stroke} />
          <Circle cx="20" cy="10" r="2" {...stroke} />
        </Svg>
      );
    case 'chevron-right':
      return (
        <Svg {...common}>
          <Path d="M9 6l6 6-6 6" {...stroke} />
        </Svg>
      );
    case 'folder':
      return (
        <Svg {...common}>
          <Path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" {...stroke} />
        </Svg>
      );
    case 'ban':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="10" {...stroke} />
          <Line x1="4.93" y1="4.93" x2="19.07" y2="19.07" {...stroke} />
        </Svg>
      );
    case 'pencil':
      return (
        <Svg {...common}>
          <Path d="M12 20h9" {...stroke} />
          <Path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" {...stroke} />
        </Svg>
      );
    case 'help-circle':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="10" {...stroke} />
          <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" {...stroke} />
          <Line x1="12" y1="17" x2="12.01" y2="17" {...stroke} />
        </Svg>
      );
    case 'download':
      return (
        <Svg {...common}>
          <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" {...stroke} />
          <Path d="M7 10l5 5 5-5" {...stroke} />
          <Line x1="12" y1="15" x2="12" y2="3" {...stroke} />
        </Svg>
      );
    case 'trash':
      return (
        <Svg {...common}>
          <Path d="M3 6h18" {...stroke} />
          <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" {...stroke} />
          <Path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" {...stroke} />
        </Svg>
      );
    case 'bell-ring':
      return (
        <Svg {...common}>
          <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" {...stroke} />
          <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" {...stroke} />
          <Path d="M4 2C2.8 3.7 2 5.7 2 8" {...stroke} />
          <Path d="M22 8c0-2.3-.8-4.3-2-6" {...stroke} />
        </Svg>
      );
    case 'arrow-left':
      return (
        <Svg {...common}>
          <Line x1="19" y1="12" x2="5" y2="12" {...stroke} />
          <Path d="M12 19l-7-7 7-7" {...stroke} />
        </Svg>
      );
    case 'shield-alert':
      return (
        <Svg {...common}>
          <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...stroke} />
          <Line x1="12" y1="8" x2="12" y2="12" {...stroke} />
          <Line x1="12" y1="16" x2="12.01" y2="16" {...stroke} />
        </Svg>
      );
    case 'arrow-right':
      return (
        <Svg {...common}>
          <Line x1="5" y1="12" x2="19" y2="12" {...stroke} />
          <Path d="M12 5l7 7-7 7" {...stroke} />
        </Svg>
      );
    case 'check':
      return (
        <Svg {...common}>
          <Path d="M20 6L9 17l-5-5" {...stroke} />
        </Svg>
      );
    case 'phone':
      return (
        <Svg {...common}>
          <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" {...stroke} />
        </Svg>
      );
    case 'mic':
      return (
        <Svg {...common}>
          <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" {...stroke} />
          <Path d="M19 10v2a7 7 0 0 1-14 0v-2" {...stroke} />
          <Line x1="12" y1="19" x2="12" y2="23" {...stroke} />
          <Line x1="8" y1="23" x2="16" y2="23" {...stroke} />
        </Svg>
      );
    case 'globe':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="10" {...stroke} />
          <Line x1="2" y1="12" x2="22" y2="12" {...stroke} />
          <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" {...stroke} />
        </Svg>
      );
    case 'briefcase':
      return (
        <Svg {...common}>
          <Path d="M3 7h18v13H3z" {...stroke} />
          <Path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" {...stroke} />
        </Svg>
      );
    case 'message-circle':
      return (
        <Svg {...common}>
          <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" {...stroke} />
        </Svg>
      );
    case 'message-square':
      return (
        <Svg {...common}>
          <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" {...stroke} />
        </Svg>
      );
    case 'link':
      return (
        <Svg {...common}>
          <Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" {...stroke} />
          <Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" {...stroke} />
        </Svg>
      );
    case 'search':
      return (
        <Svg {...common}>
          <Circle cx="11" cy="11" r="8" {...stroke} />
          <Line x1="21" y1="21" x2="16.65" y2="16.65" {...stroke} />
        </Svg>
      );
    case 'copy':
      return (
        <Svg {...common}>
          <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" {...stroke} />
          <Path d="M9 4h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" {...stroke} />
        </Svg>
      );
    case 'share-2':
      return (
        <Svg {...common}>
          <Circle cx="18" cy="5" r="3" {...stroke} />
          <Circle cx="6" cy="12" r="3" {...stroke} />
          <Circle cx="18" cy="19" r="3" {...stroke} />
          <Path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" {...stroke} />
        </Svg>
      );
    case 'trending-up':
      return (
        <Svg {...common}>
          <Path d="M22 7L13.5 15.5 8.5 10.5 2 17" {...stroke} />
          <Path d="M16 7h6v6" {...stroke} />
        </Svg>
      );
    case 'mail':
      return (
        <Svg {...common}>
          <Path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" {...stroke} />
          <Path d="M22 6l-10 7L2 6" {...stroke} />
        </Svg>
      );
    case 'info':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="10" {...stroke} />
          <Line x1="12" y1="16" x2="12" y2="12" {...stroke} />
          <Line x1="12" y1="8" x2="12.01" y2="8" {...stroke} />
        </Svg>
      );
    case 'shield-off':
      return (
        <Svg {...common}>
          <Path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18" {...stroke} />
          <Path d="M4.73 4.73L4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38" {...stroke} />
          <Line x1="1" y1="1" x2="23" y2="23" {...stroke} />
        </Svg>
      );
    case 'navigation':
      return (
        <Svg {...common}>
          <Path d="M3 11l19-9-9 19-2-8-8-2z" {...stroke} />
        </Svg>
      );
    case 'building':
      return (
        <Svg {...common}>
          <Path d="M6 2h12a1 1 0 0 1 1 1v18H5V3a1 1 0 0 1 1-1z" {...stroke} />
          <Line x1="9" y1="6" x2="10" y2="6" {...stroke} />
          <Line x1="14" y1="6" x2="15" y2="6" {...stroke} />
          <Line x1="9" y1="10" x2="10" y2="10" {...stroke} />
          <Line x1="14" y1="10" x2="15" y2="10" {...stroke} />
          <Line x1="9" y1="14" x2="10" y2="14" {...stroke} />
          <Line x1="14" y1="14" x2="15" y2="14" {...stroke} />
          <Path d="M10 21v-3h4v3" {...stroke} />
        </Svg>
      );
    case 'car':
      // Berline vue de cote : capot, cabine (vitre avant + arriere slope), coffre,
      // 2 roues. Plus parlant qu'une vue de face minimaliste pour symboliser un
      // voyage / trajet. Refonte 2026-05-24.
      return (
        <Svg {...common}>
          {/* Silhouette : bas de carrosserie + remontee aile av + pavillon + aile ar */}
          <Path d="M2 15h20M3 15v-3l2-1 3-4h8l3 4 2 1v3" {...stroke} />
          {/* Ligne de vitrage (separation cabine / capot-coffre) */}
          <Path d="M8 8l-3 4M16 8l3 4" {...stroke} />
          {/* Roues */}
          <Circle cx="7" cy="17" r="2" {...stroke} />
          <Circle cx="17" cy="17" r="2" {...stroke} />
        </Svg>
      );
    case 'users-plus':
      return (
        <Svg {...common}>
          <Path d="M14 19v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" {...stroke} />
          <Circle cx="7.5" cy="7" r="3.5" {...stroke} />
          <Path d="M20 8v6" {...stroke} />
          <Path d="M17 11h6" {...stroke} />
        </Svg>
      );
    case 'briefcase-medical':
      return (
        <Svg {...common}>
          <Path d="M3 7h18v13H3z" {...stroke} />
          <Path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" {...stroke} />
          <Line x1="12" y1="11" x2="12" y2="17" {...stroke} />
          <Line x1="9" y1="14" x2="15" y2="14" {...stroke} />
        </Svg>
      );
    case 'thumbs-up':
      return (
        <Svg {...common}>
          <Path
            d="M7 22V11M2 13v7a2 2 0 0 0 2 2h13.4a2 2 0 0 0 2-1.7l1.4-7A2 2 0 0 0 18.8 11H14V6a3 3 0 0 0-3-3l-4 8"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={color}
          />
        </Svg>
      );
  }
}
