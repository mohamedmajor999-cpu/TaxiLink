import Svg, { Path, Text as SvgText } from 'react-native-svg';

export function SlideIlloRgpd() {
  return (
    <Svg width={200} height={222} viewBox="0 0 180 200" fill="none">
      <Path
        d="M90 10 L160 35 L160 100 Q160 150 90 190 Q20 150 20 100 L20 35 Z"
        fill="#FFD11A" stroke="#FFD11A" strokeWidth={2} strokeLinejoin="round"
      />
      <Path
        d="M90 30 L140 48 L140 100 Q140 140 90 170 Q40 140 40 100 L40 48 Z"
        fill="#000"
      />
      <Path
        d="M65 100 L82 117 L118 80"
        stroke="#FFD11A" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round"
      />
      <SvgText
        x={90} y={150} textAnchor="middle"
        fontWeight="700" fontSize={11} fill="#FFD11A"
        letterSpacing={2}
      >
        RGPD
      </SvgText>
    </Svg>
  );
}
