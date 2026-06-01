// Augmente les types react-native pour supporter className via NativeWind.
import 'react-native';

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface ImageProps {
    className?: string;
  }
  interface PressableProps {
    className?: string;
  }
  interface ScrollViewProps {
    contentContainerClassName?: string;
  }
  interface FlatListProps<ItemT> {
    columnWrapperClassName?: string;
  }
  interface TextInputProps {
    className?: string;
    placeholderClassName?: string;
  }
  interface SwitchProps {
    className?: string;
  }
  interface TouchableWithoutFeedbackProps {
    className?: string;
  }
}

