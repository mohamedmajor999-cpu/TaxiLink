import { Pressable, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/lib/theme';

export function FieldRow({
  leading,
  children,
}: {
  leading: React.ReactNode;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ width: 24, alignItems: 'center', justifyContent: 'center' }}>{leading}</View>
      <View style={{ flex: 1, minWidth: 0 }}>{children}</View>
    </View>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 0.5, color: colors.inkSoft, textTransform: 'uppercase' }}>
      {children}
    </Text>
  );
}

export function FieldInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  multiline,
  numberOfLines,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad' | 'numeric' | 'decimal-pad' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
}) {
  const { colors } = useTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.inkSoft}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      multiline={multiline}
      numberOfLines={numberOfLines}
      style={{
        fontSize: 15,
        fontWeight: '600',
        color: colors.ink,
        paddingVertical: 0,
        marginTop: 2,
        letterSpacing: -0.1,
      }}
    />
  );
}

export function WhenPill({
  active,
  onPress,
  label,
  icon,
}: {
  active: boolean;
  onPress: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        height: 36,
        borderRadius: 999,
        backgroundColor: active ? colors.brand : colors.surface,
        borderWidth: 1,
        borderColor: active ? colors.brand : colors.border,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      {icon}
      <Text style={{ fontSize: 13, fontWeight: '700', color: active ? colors.brandInk : colors.ink }}>{label}</Text>
    </Pressable>
  );
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        height: 44,
      }}
    >
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        style={{ width: 40, height: 44, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.ink }}>−</Text>
      </Pressable>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.ink }}>{value}</Text>
      </View>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        style={{ width: 40, height: 44, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.ink }}>+</Text>
      </Pressable>
    </View>
  );
}
