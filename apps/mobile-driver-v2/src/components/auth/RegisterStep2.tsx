import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import type { DepartementInfo } from '@taxilink/core';

interface Props {
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  department: string;
  setDepartment: (v: string) => void;
  departmentInfo: DepartementInfo | null;
  loading: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

export function RegisterStep2(props: Props) {
  return (
    <View className="gap-5">
      <TextField label="Nom" value={props.lastName} onChange={props.setLastName} placeholder="Fontaine" autoCapitalize="words" />
      <TextField label="Prénom" value={props.firstName} onChange={props.setFirstName} placeholder="Marc" autoCapitalize="words" />
      <TextField label="Téléphone" value={props.phone} onChange={props.setPhone} placeholder="0601020304" keyboardType="phone-pad" />

      <View>
        <Text className="text-sm font-bold text-secondary uppercase mb-2 tracking-widest">Département</Text>
        <TextInput
          value={props.department}
          onChangeText={props.setDepartment}
          placeholder="13 (Bouches-du-Rhône), 75 (Paris)…"
          placeholderTextColor="#9CA3AF"
          maxLength={3}
          autoCapitalize="characters"
          className="h-14 px-5 rounded-xl border-2 border-line bg-paper text-base font-semibold text-secondary"
        />
        {props.department.length > 0 && (
          <Text className={`mt-1.5 text-sm font-semibold ${props.departmentInfo ? 'text-success' : 'text-danger'}`}>
            {props.departmentInfo ? `✓ ${props.departmentInfo.name}` : 'Code non reconnu'}
          </Text>
        )}
      </View>

      <View className="flex-row gap-3">
        <Pressable onPress={props.onBack} className="flex-1 h-14 rounded-xl border-2 border-line bg-paper items-center justify-center">
          <Text className="font-bold text-secondary text-base">← Retour</Text>
        </Pressable>
        <Pressable
          onPress={props.onSubmit}
          disabled={props.loading}
          className={`flex-1 h-14 rounded-xl bg-primary items-center justify-center ${props.loading ? 'opacity-60' : ''}`}
        >
          {props.loading ? <ActivityIndicator color="#1A1A1A" /> : <Text className="font-bold text-secondary text-base">Créer mon compte</Text>}
        </Pressable>
      </View>
    </View>
  );
}

function TextField(p: { label: string; value: string; onChange: (v: string) => void; placeholder: string; autoCapitalize?: 'none' | 'words' | 'sentences'; keyboardType?: 'default' | 'phone-pad' }) {
  return (
    <View>
      <Text className="text-sm font-bold text-secondary uppercase mb-2 tracking-widest">{p.label}</Text>
      <TextInput
        value={p.value}
        onChangeText={p.onChange}
        placeholder={p.placeholder}
        placeholderTextColor="#9CA3AF"
        autoCapitalize={p.autoCapitalize ?? 'none'}
        autoCorrect={false}
        keyboardType={p.keyboardType ?? 'default'}
        className="h-14 px-5 rounded-xl border-2 border-line bg-paper text-base font-semibold text-secondary"
      />
    </View>
  );
}
