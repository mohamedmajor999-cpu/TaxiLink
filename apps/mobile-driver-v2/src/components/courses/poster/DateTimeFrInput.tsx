import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

/**
 * Input date moderne au format français JJ/MM/AAAA :
 * - Clavier numérique automatique
 * - Auto-insertion des `/` pendant la frappe
 * - Bord coloré selon validité (gris → noir focus → vert valide → rouge invalide)
 * - Convertit en interne vers AAAA-MM-JJ pour le state parent
 */
export function DateFrInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { colors } = useTheme();
  // `value` arrive en AAAA-MM-JJ depuis le parent → affichage local en JJ/MM/AAAA.
  const [display, setDisplay] = useState(() => isoToFr(value));
  const [focused, setFocused] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  useEffect(() => { setDisplay(isoToFr(value)); }, [value]);

  const validity = useMemo(() => checkFrDate(display), [display]);

  function onText(input: string) {
    const formatted = formatFrDate(input);
    setDisplay(formatted);
    const iso = frToIso(formatted);
    if (iso) onChange(iso);
    else if (formatted.length === 0) onChange('');
  }

  function onPickerChange(_event: DateTimePickerEvent, picked?: Date) {
    setPickerOpen(false);
    if (!picked) return;
    const iso = `${picked.getFullYear()}-${String(picked.getMonth() + 1).padStart(2, '0')}-${String(picked.getDate()).padStart(2, '0')}`;
    onChange(iso);
  }

  const pickerValue = frToIso(display) ? new Date(frToIso(display)!) : new Date();

  return (
    <>
      <FieldShell
        label="Date"
        icon="calendar"
        focused={focused}
        validity={validity}
        helper={validity === 'invalid' ? 'JJ/MM/AAAA invalide' : null}
        rightAccessory={
          <PickerButton onPress={() => setPickerOpen(true)} icon="calendar" />
        }
      >
        <TextInput
          value={display}
          onChangeText={onText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="JJ/MM/AAAA"
          placeholderTextColor={colors.inkSoft}
          keyboardType="number-pad"
          maxLength={10}
          style={{
            fontSize: 17,
            fontWeight: '600',
            color: colors.ink,
            letterSpacing: 0.5,
            paddingVertical: 0,
          }}
        />
      </FieldShell>
      {pickerOpen && (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={new Date(Date.now() - 24 * 60 * 60 * 1000)}
          onChange={onPickerChange}
          locale="fr-FR"
        />
      )}
    </>
  );
}

/**
 * Input heure moderne HH:MM 24h :
 * - Auto-insertion du `:` après 2 chiffres
 * - Validation 00-23 / 00-59
 */
export function TimeFrInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { colors } = useTheme();
  const [display, setDisplay] = useState(value);
  const [focused, setFocused] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  useEffect(() => { setDisplay(value); }, [value]);

  const validity = useMemo(() => checkTime(display), [display]);

  function onText(input: string) {
    const formatted = formatTime(input);
    setDisplay(formatted);
    if (checkTime(formatted) !== 'invalid') onChange(formatted);
  }

  function onPickerChange(_event: DateTimePickerEvent, picked?: Date) {
    setPickerOpen(false);
    if (!picked) return;
    const hh = String(picked.getHours()).padStart(2, '0');
    const mm = String(picked.getMinutes()).padStart(2, '0');
    onChange(`${hh}:${mm}`);
  }

  const pickerValue = useMemo(() => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(display);
    if (!m) return new Date();
    const d = new Date();
    d.setHours(Number(m[1]), Number(m[2]), 0, 0);
    return d;
  }, [display]);

  return (
    <>
      <FieldShell
        label="Heure"
        icon="clock"
        focused={focused}
        validity={validity}
        helper={validity === 'invalid' ? '00:00 → 23:59' : null}
        rightAccessory={
          <PickerButton onPress={() => setPickerOpen(true)} icon="clock" />
        }
      >
        <TextInput
          value={display}
          onChangeText={onText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="HH:MM"
          placeholderTextColor={colors.inkSoft}
          keyboardType="number-pad"
          maxLength={5}
          style={{
            fontSize: 17,
            fontWeight: '600',
            color: colors.ink,
            letterSpacing: 0.5,
            paddingVertical: 0,
          }}
        />
      </FieldShell>
      {pickerOpen && (
        <DateTimePicker
          value={pickerValue}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onPickerChange}
          locale="fr-FR"
          minuteInterval={5}
        />
      )}
    </>
  );
}

function PickerButton({ onPress, icon }: { onPress: () => void; icon: 'calendar' | 'clock' }) {
  const { colors, isDark } = useTheme();
  return (
    <View style={{ marginLeft: 'auto', height: 32, width: 32, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.brand }}>
      <Pressable
        onPress={onPress}
        accessibilityLabel={icon === 'calendar' ? 'Ouvrir le calendrier' : 'Ouvrir l\'horloge'}
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)' }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon name={icon} size={16} color={colors.brandInk} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}

type Validity = 'empty' | 'partial' | 'valid' | 'invalid';

function FieldShell({
  label, icon, focused, validity, helper, rightAccessory, children,
}: {
  label: string;
  icon: 'calendar' | 'clock';
  focused: boolean;
  validity: Validity;
  helper: string | null;
  rightAccessory?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const borderColor =
    validity === 'invalid' ? colors.danger
    : focused ? colors.ink
    : validity === 'valid' ? colors.success
    : colors.border;

  return (
    <View>
      <View
        style={{
          borderWidth: focused || validity === 'invalid' || validity === 'valid' ? 1.5 : 1,
          borderColor,
          borderRadius: 14,
          backgroundColor: focused ? colors.surface : colors.surfaceMuted,
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Icon name={icon} size={13} color={focused ? colors.ink : colors.inkSoft} strokeWidth={2.2} />
          <Text
            style={{
              fontSize: 10.5,
              fontWeight: '800',
              letterSpacing: 0.6,
              color: focused ? colors.ink : colors.inkSoft,
              textTransform: 'uppercase',
            }}
          >
            {label}
          </Text>
          {validity === 'valid' && !rightAccessory && (
            <View style={{ marginLeft: 'auto' }}>
              <Icon name="check" size={12} color={colors.success} strokeWidth={3} />
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1 }}>{children}</View>
          {rightAccessory}
        </View>
      </View>
      {helper && (
        <Text style={{ marginTop: 4, marginLeft: 4, fontSize: 11, fontWeight: '600', color: colors.danger }}>
          {helper}
        </Text>
      )}
    </View>
  );
}

// ─── Helpers de formatage ──────────────────────────────────────────────

/** AAAA-MM-JJ → JJ/MM/AAAA (renvoie '' si format invalide ou vide). */
function isoToFr(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return '';
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** JJ/MM/AAAA → AAAA-MM-JJ (renvoie null si pas complet ou invalide). */
function frToIso(fr: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(fr.trim());
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (
    d.getFullYear() !== Number(yyyy)
    || d.getMonth() !== Number(mm) - 1
    || d.getDate() !== Number(dd)
  ) return null;
  return `${yyyy}-${mm}-${dd}`;
}

/** Insère les `/` automatiquement : on garde uniquement les chiffres et on
 * reconstruit JJ/MM/AAAA au fur et à mesure. Tape "12052026" → "12/05/2026". */
function formatFrDate(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function checkFrDate(fr: string): Validity {
  if (!fr) return 'empty';
  if (frToIso(fr) !== null) return 'valid';
  if (fr.length < 10) return 'partial';
  return 'invalid';
}

/** "1234" → "12:34", auto-insère le `:`. */
function formatTime(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function checkTime(t: string): Validity {
  if (!t) return 'empty';
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (m) {
    const h = Number(m[1]);
    const mi = Number(m[2]);
    if (h >= 0 && h <= 23 && mi >= 0 && mi <= 59) return 'valid';
    return 'invalid';
  }
  if (t.length < 5) return 'partial';
  return 'invalid';
}
