import { Image } from 'react-native';

interface Props {
  width?: number;
  height?: number;
  className?: string;
}

export function Logo({ width = 200, height = 40, className }: Props) {
  return (
    <Image
      source={require('../../../assets/brand/logo-email.png')}
      style={{ width, height, resizeMode: 'contain' }}
      className={className}
    />
  );
}
