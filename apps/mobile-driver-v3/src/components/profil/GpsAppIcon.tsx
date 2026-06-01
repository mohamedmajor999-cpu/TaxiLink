import Svg, { Circle, Path } from 'react-native-svg';

interface Props {
  size?: number;
}

export function WazeIcon({ size = 16 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3c-4.97 0-9 3.58-9 8 0 1.76.64 3.39 1.72 4.72-.16.56-.47 1.3-.97 1.8-.2.2-.13.54.15.62 1.46.42 3.13-.11 4.05-.56A9.73 9.73 0 0012 19c4.97 0 9-3.58 9-8s-4.03-8-9-8z"
        stroke="#33CCFF"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Circle cx={9} cy={10} r={1} fill="#33CCFF" />
      <Circle cx={15} cy={10} r={1} fill="#33CCFF" />
    </Svg>
  );
}

export function GMapsIcon({ size = 16 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 7 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8z" fill="#EA4335" />
      <Circle cx={12} cy={10} r={3} fill="#FFFFFF" />
    </Svg>
  );
}
