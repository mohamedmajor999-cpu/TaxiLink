import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { searchGoogle, resolveGooglePlace, type AddressSuggestion } from '@taxilink/services';

import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/lib/theme';

interface Props {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  onSelectSuggestion: (s: { label: string; lat: number; lng: number }) => void;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

const SESSION_TOKEN = () => Math.random().toString(36).slice(2);

/**
 * Champ d'adresse mobile avec suggestions Google Places. Saisie debounce 250ms,
 * puis appelle `searchGoogle()`. Au tap sur une suggestion, `resolveGooglePlace()`
 * récupère les coords (lat/lng) et notifie le parent via `onSelectSuggestion`.
 */
export function AddressAutocompleteField({
  label, placeholder, value, onChangeText, onSelectSuggestion, leading, trailing,
}: Props) {
  const { colors, isDark } = useTheme();
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [resolving, setResolving] = useState(false);
  const sessionRef = useRef(SESSION_TOKEN());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Quand l'utilisateur sélectionne une suggestion, on met à jour `value` via
  // onChangeText — sans la mention `selectedRef`, l'effect ci-dessous relance
  // immédiatement une recherche sur le label complet et réaffiche un dropdown.
  const selectedRef = useRef(false);
  // Dernière valeur pour laquelle on a envoyé des coords au parent. Permet de
  // savoir si la valeur courante a besoin d'un geocode au blur (saisie manuelle
  // sans sélection dans le dropdown).
  const resolvedValueRef = useRef<string>('');

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    const trimmed = value.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      searchGoogle(trimmed, ctrl.signal, null, sessionRef.current)
        .then((s) => { if (!ctrl.signal.aborted) setSuggestions(s); })
        .catch(() => undefined)
        .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  async function handleSelect(s: AddressSuggestion) {
    selectedRef.current = true;
    onChangeText(s.label);
    resolvedValueRef.current = s.label;
    setSuggestions([]);
    setFocused(false);
    // `searchGoogle` renvoie toujours lat/lng = 0 comme placeholders. Les vraies
    // coords s'obtiennent via resolveGooglePlace(placeId). Donc on n'utilise les
    // coords directes que si elles sont NON-zéro (cas peu probable, mais futur-proof).
    if ((s.lat !== 0 || s.lng !== 0) && typeof s.lat === 'number' && typeof s.lng === 'number') {
      onSelectSuggestion({ label: s.label, lat: s.lat, lng: s.lng });
      sessionRef.current = SESSION_TOKEN();
      return;
    }
    if (!s.placeId) return;
    setResolving(true);
    try {
      const details = await resolveGooglePlace(s.placeId, undefined, sessionRef.current);
      if (details) {
        onSelectSuggestion({ label: s.label, lat: details.lat, lng: details.lng });
      }
    } finally {
      setResolving(false);
      sessionRef.current = SESSION_TOKEN();
    }
  }

  /**
   * Au blur : si l'utilisateur a tapé une adresse sans sélectionner dans le
   * dropdown, on tente quand même un geocode pour récupérer les coords. Sans
   * coords, useMissionRoute ne calcule pas distance/prix → footer reste vide.
   */
  async function handleBlur() {
    setTimeout(() => setFocused(false), 150);
    const v = value.trim();
    if (v.length < 5) return;
    if (v === resolvedValueRef.current) return;
    setResolving(true);
    try {
      const sugg = await searchGoogle(v, undefined, null);
      const first = sugg[0];
      if (!first) return;
      let lat: number | null = null;
      let lng: number | null = null;
      let label = first.label;
      // Idem : searchGoogle renvoie 0,0 comme placeholder → toujours resolveGooglePlace.
      if ((first.lat !== 0 || first.lng !== 0) && typeof first.lat === 'number' && typeof first.lng === 'number') {
        lat = first.lat; lng = first.lng;
      } else if (first.placeId) {
        const details = await resolveGooglePlace(first.placeId);
        if (details) { lat = details.lat; lng = details.lng; }
      }
      if (lat != null && lng != null) {
        resolvedValueRef.current = label;
        onChangeText(label);
        onSelectSuggestion({ label, lat, lng });
      }
    } catch { /* silent : on garde la saisie brute */ } finally {
      setResolving(false);
    }
  }

  const showDropdown = focused && (loading || suggestions.length > 0);

  return (
    <View style={{ position: 'relative' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ width: 24, alignItems: 'center', justifyContent: 'center' }}>{leading}</View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 0.5, color: colors.inkSoft, textTransform: 'uppercase' }}>
            {label}
          </Text>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setFocused(true)}
            onBlur={handleBlur}
            placeholder={placeholder}
            placeholderTextColor={colors.inkSoft}
            style={{ fontSize: 15, fontWeight: '600', color: colors.ink, paddingVertical: 0, marginTop: 2, letterSpacing: -0.1 }}
            autoCorrect={false}
            autoCapitalize="words"
          />
        </View>
        {(loading || resolving) && <ActivityIndicator size="small" color={colors.inkMuted} />}
        {trailing}
      </View>

      {showDropdown && (
        <View
          style={{
            position: 'absolute',
            top: 64,
            left: 38,
            right: 0,
            zIndex: 100,
            elevation: 8,
            backgroundColor: colors.surfaceElevated,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOpacity: isDark ? 0.55 : 0.08,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            maxHeight: 280,
            overflow: 'hidden',
          }}
        >
          {suggestions.length === 0 && loading && (
            <View style={{ padding: 12, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.inkMuted} />
            </View>
          )}
          {suggestions.slice(0, 6).map((s) => (
            <Pressable
              key={s.placeId ?? `${s.label}-${s.lat}`}
              onPress={() => handleSelect(s)}
              android_ripple={{ color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderSoft }}
            >
              <Icon name="map-pin" size={16} color={colors.inkSoft} strokeWidth={2} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontSize: 13.5, fontWeight: '600', color: colors.ink }}>
                  {s.mainText ?? s.label}
                </Text>
                {s.mainText && s.label !== s.mainText && (
                  <Text numberOfLines={1} style={{ fontSize: 11.5, color: colors.inkSoft, marginTop: 1 }}>
                    {s.label.replace(`${s.mainText}, `, '')}
                  </Text>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
