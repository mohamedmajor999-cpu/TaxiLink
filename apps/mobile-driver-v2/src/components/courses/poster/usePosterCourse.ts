import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { groupService, reportError, userPrefsService } from '@taxilink/services';
import type { MissionDefaults } from '@taxilink/services';
import type { Group, MissionInput, MedicalMotif, MissionVisibility, TransportType } from '@taxilink/core';
import { validateMission } from '@taxilink/core';

import { useAuth } from '@/hooks/useAuth';
import { useMissionRoute } from './useMissionRoute';
import { computeEffectivePrice } from './computeEffectivePrice';
import { usePosterVoiceFlow } from './usePosterVoiceFlow';
import { useFieldAddressVoice } from './useFieldAddressVoice';
import { createMissionMobile } from './createMissionMobile';

export type MissionFormType = 'CPAM' | 'PRIVE';
export type WhenMode = 'now' | 'later';

function defaultDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function defaultTime(): string {
  const d = new Date(Date.now() + 30 * 60_000);
  const m = Math.ceil(d.getMinutes() / 15) * 15;
  d.setMinutes(m % 60, 0, 0);
  if (m >= 60) d.setHours(d.getHours() + 1);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function buildScheduledAt(date: string, time: string): string | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!dateMatch || !timeMatch) return null;
  const [, y, mo, da] = dateMatch;
  const [, hh, mm] = timeMatch;
  const d = new Date(Number(y), Number(mo) - 1, Number(da), Number(hh), Number(mm), 0, 0);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function parsePrice(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function usePosterCourse() {
  const { user } = useAuth();
  const driverId = user?.id ?? null;

  const [gatePassed, setGatePassed] = useState(false);
  const [type, setType] = useState<MissionFormType>('PRIVE');
  const [visibility, setVisibility] = useState<MissionVisibility>('PUBLIC');
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  const [when, setWhen] = useState<WhenMode>('now');
  const [date, setDate] = useState(defaultDate());
  const [time, setTime] = useState(defaultTime());
  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [price, setPrice] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  // Routing : distance/durée/coords (debounce + Google Routes ou OSRM fallback)
  // Date/heure toujours dans c.date/c.time (les pills sont juste des presets).
  const scheduledAtIso = useMemo(() => buildScheduledAt(date, time), [date, time]);
  const route = useMissionRoute({ scheduledAt: scheduledAtIso });

  const [medicalMotif, setMedicalMotif] = useState<MedicalMotif | null>(null);
  const [returnTrip, setReturnTrip] = useState(false);
  const [transportType, setTransportType] = useState<TransportType | null>(null);
  const [passengers, setPassengers] = useState<number>(1);
  const [extraBagages, setExtraBagages] = useState(0);
  const [extraEncombrants, setExtraEncombrants] = useState(0);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  // Voice flow : record → parseVoiceAudio (Claude/Gemini) → applique les champs
  const voice = usePosterVoiceFlow({
    setType, setMedicalMotif, setTransportType, setReturnTrip,
    setPassengers, setDeparture, setDestination, setDate, setTime,
    setWhen, setPrice, setPriceMin, setPriceMax, setPatientName, setPhone,
    setVisibility, setGroupIds,
    setDepartureCoords: route.setDepartureCoords,
    setDestinationCoords: route.setDestinationCoords,
    setExtraBagages, setExtraEncombrants,
    myGroups,
  });

  // Mics par champ : Whisper-seul (mode='address') + résolution Google Places.
  // Définis ici (pas dans le composant) pour que le screen puisse agréger les
  // états listening/processing et afficher banner+modal globalement.
  const handleSelectDeparture = (s: { label: string; lat: number; lng: number }) => {
    setDeparture(s.label);
    route.setDepartureCoords({ lat: s.lat, lng: s.lng });
  };
  const handleSelectDestination = (s: { label: string; lat: number; lng: number }) => {
    setDestination(s.label);
    route.setDestinationCoords({ lat: s.lat, lng: s.lng });
  };
  const departureVoice = useFieldAddressVoice({
    onChangeText: setDeparture,
    onSelectSuggestion: handleSelectDeparture,
    // Au tap du mic adresse : on efface le texte + les coords pour repartir
    // d'une feuille blanche. Sinon l'ancienne adresse + ses coords restent
    // affichées 2-3s pendant que Whisper tourne, ce qui prête à confusion.
    onStart: () => {
      setDeparture('');
      route.setDepartureCoords(null);
    },
  });
  const destinationVoice = useFieldAddressVoice({
    onChangeText: setDestination,
    onSelectSuggestion: handleSelectDestination,
    onStart: () => {
      setDestination('');
      route.setDestinationCoords(null);
    },
  });

  // Pré-réglages mémorisés (user_metadata.mission_defaults) — chargés une seule fois
  // après que les groupes soient connus pour filtrer les groupIds invalides.
  const [savedDefaults, setSavedDefaults] = useState<MissionDefaults | null>(null);
  const seededRef = useRef(false);

  useEffect(() => {
    if (!driverId) return;
    let cancelled = false;
    setLoadingGroups(true);
    groupService
      .getMyGroups(driverId)
      .then((g) => { if (!cancelled) setMyGroups(g); })
      .catch((err) => reportError(err, { tags: { phase: 'poster-load-groups' } }))
      .finally(() => { if (!cancelled) setLoadingGroups(false); });
    return () => { cancelled = true; };
  }, [driverId]);

  // Charge les pré-réglages (mission_defaults) après que les groupes soient
  // chargés, pour pouvoir filtrer les groupIds qui n'existent plus.
  useEffect(() => {
    if (!driverId || seededRef.current) return;
    if (myGroups.length === 0) return; // attend les groupes
    seededRef.current = true;
    let cancelled = false;
    userPrefsService
      .getMissionDefaults()
      .then((prefs) => {
        if (cancelled) return;
        setSavedDefaults(prefs);
        if (prefs.type) setType(prefs.type);
        if (prefs.visibility === 'PUBLIC') {
          setVisibility('PUBLIC');
          setGroupIds([]);
        } else if (prefs.visibility === 'GROUP') {
          setVisibility('GROUP');
          setGroupIds(prefs.groupIds.filter((id) => myGroups.some((g) => g.id === id)));
        }
      })
      .catch(() => { /* silencieux : pref pas critique */ });
    return () => { cancelled = true; };
  }, [driverId, myGroups]);

  // Seed defaults CPAM
  useEffect(() => {
    if (type !== 'CPAM') return;
    if (transportType === null) setTransportType('SEATED');
    if (medicalMotif === null) setMedicalMotif('HDJ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const tpmr = transportType === 'WHEELCHAIR';
  const setTpmr = (v: boolean) => setTransportType(v ? 'WHEELCHAIR' : 'SEATED');

  /** Pill "Maintenant" : remet date/heure courantes et passe en mode 'now'. */
  function setWhenNow() {
    setWhen('now');
    setDate(defaultDate());
    setTime(defaultTime());
  }

  /** Pill "Plus tard" : pré-remplit avec maintenant +30 min (arrondi 15) et
   * passe en mode 'later'. L'utilisateur peut ensuite éditer librement. */
  function setWhenLater() {
    setWhen('later');
    setDate(defaultDate());
    setTime(defaultTime());
  }

  /** Toute édition manuelle de la date bascule auto en mode 'later'. */
  function onChangeDate(v: string) {
    setDate(v);
    if (when !== 'later') setWhen('later');
  }

  function onChangeTime(v: string) {
    setTime(v);
    if (when !== 'later') setWhen('later');
  }

  const onSelectPublic = () => {
    setVisibility('PUBLIC');
    setGroupIds([]);
  };

  const toggleGroup = (id: string) => {
    setVisibility('GROUP');
    setGroupIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const canContinue = useMemo(() => {
    return visibility === 'PUBLIC' || (visibility === 'GROUP' && groupIds.length > 0);
  }, [visibility, groupIds]);

  // True si le couple (type, visibility, groupIds) correspond aux pré-réglages
  // déjà sauvegardés. Sert à pré-cocher la case "Mémoriser" sur Preflight.
  const matchesSavedDefaults = useMemo(() => {
    if (!savedDefaults) return false;
    if (savedDefaults.type !== type) return false;
    if (savedDefaults.visibility !== visibility) return false;
    const a = [...savedDefaults.groupIds].sort();
    const b = [...groupIds].sort();
    if (a.length !== b.length) return false;
    return a.every((id, i) => id === b[i]);
  }, [savedDefaults, type, visibility, groupIds]);

  /** Valide l'étape 1 ; sauvegarde les choix comme préréglage si remember=true. */
  function passGate(remember: boolean) {
    setGatePassed(true);
    if (!remember) return;
    const snapshot: MissionDefaults = { type, visibility, groupIds };
    userPrefsService
      .updateMissionDefaults(snapshot)
      .then(() => setSavedDefaults(snapshot))
      .catch((err) => reportError(err, { tags: { phase: 'poster-save-defaults' } }));
  }

  /** Repart d'une feuille blanche sur l'étape 2 : tous les champs vidés,
   *  coords nulles, date/heure remises à maintenant. On garde type/visibility/
   *  groupIds (étape 1) — si l'user veut changer ça il clique sur Retour. */
  function resetForm() {
    setDeparture(''); setDestination('');
    route.setDepartureCoords(null); route.setDestinationCoords(null);
    setPatientName(''); setPhone(''); setNotes('');
    setPrice(''); setPriceMin(''); setPriceMax('');
    setMedicalMotif(null); setReturnTrip(false); setTransportType(null);
    setPassengers(1); setExtraBagages(0); setExtraEncombrants(0);
    setWhen('now'); setDate(defaultDate()); setTime(defaultTime());
    setError(null);
  }

  /** True si au moins un champ a été rempli — sert à afficher le bouton
   *  "Tout effacer" uniquement quand il y a quelque chose à effacer. */
  const hasAnyContent = useMemo(() => Boolean(
    departure || destination || patientName || phone || notes ||
    price || priceMin || priceMax || medicalMotif || returnTrip ||
    (passengers && passengers > 1) || extraBagages > 0 || extraEncombrants > 0,
  ), [departure, destination, patientName, phone, notes, price, priceMin, priceMax,
      medicalMotif, returnTrip, passengers, extraBagages, extraEncombrants]);

  const canSubmit = useMemo(() => {
    if (saving) return false;
    if (departure.trim().length < 5) return false;
    if (destination.trim().length < 5) return false;
    if (type === 'CPAM' && !patientName.trim()) return false;
    if (type === 'CPAM' && !medicalMotif) return false;
    if (visibility === 'GROUP' && groupIds.length === 0) return false;
    return true;
  }, [saving, departure, destination, type, patientName, medicalMotif, visibility, groupIds]);

  // Tarif live : si l'utilisateur a saisi un prix → utilisé tel quel ; sinon
  // estimation auto (CPAM via cpamFareEstimate, Privé via marseilleFareRange)
  // dès que distance/durée sont calculées par useMissionRoute.
  const effectivePrice = useMemo(
    () => computeEffectivePrice({
      price, priceMin, priceMax,
      type, medicalMotif,
      distanceKm: route.distanceKm,
      durationMin: route.durationMin,
      staticDurationMin: route.staticDurationMin,
      date,
      time,
      departure, destination,
      passengers, transportType, returnTrip,
      extraBagages, extraEncombrants,
    }),
    [price, priceMin, priceMax, type, medicalMotif,
      route.distanceKm, route.durationMin, route.staticDurationMin,
      when, date, time, departure, destination,
      passengers, transportType, returnTrip,
      extraBagages, extraEncombrants],
  );

  const previewFare = useMemo(() => {
    const typed = parsePrice(price);
    if (typed != null && typed > 0) {
      return { value: typed, isEstimated: false, min: null as number | null, max: null as number | null };
    }
    if (effectivePrice?.kind === 'fixed') {
      return { value: effectivePrice.value, isEstimated: effectivePrice.value > 0, min: null, max: null };
    }
    if (effectivePrice?.kind === 'range') {
      const mid = Math.round((effectivePrice.min + effectivePrice.max) / 2);
      return { value: mid, isEstimated: !(priceMin.trim() && priceMax.trim()), min: effectivePrice.min, max: effectivePrice.max };
    }
    return { value: 0, isEstimated: false, min: null, max: null };
  }, [price, priceMin, priceMax, effectivePrice]);

  async function submit(opts?: { share?: boolean }): Promise<string | null> {
    setError(null);
    setSaving(true);
    try {
      // Toujours utiliser c.date/c.time : l'utilisateur peut avoir édité même
      // en mode "Maintenant" (les pills sont juste des presets de pré-remplissage).
      const scheduled_at = buildScheduledAt(date, time);
      if (!scheduled_at) throw new Error('Date ou heure invalide');

      const typedPrice = parsePrice(price);
      if (price.trim() && typedPrice == null) throw new Error('Le prix doit être un nombre positif');
      const minNum = type === 'PRIVE' ? parsePrice(priceMin) : null;
      const maxNum = type === 'PRIVE' ? parsePrice(priceMax) : null;
      const hasRange = minNum != null && maxNum != null;
      if (hasRange && minNum! > maxNum!) throw new Error('Le prix maximum doit être supérieur ou égal au minimum');
      // Prix canonique : midpoint si fourchette, sinon prix saisi, sinon
      // estimation auto via effectivePrice (l'utilisateur a juste validé la valeur calculée).
      let canonicalPrice: number | null = null;
      if (hasRange) canonicalPrice = Math.round((minNum! + maxNum!) / 2);
      else if (typedPrice != null) canonicalPrice = typedPrice;
      else if (effectivePrice?.kind === 'fixed') canonicalPrice = effectivePrice.value;
      else if (effectivePrice?.kind === 'range') canonicalPrice = Math.round((effectivePrice.min + effectivePrice.max) / 2);

      const payload: MissionInput = {
        type,
        medical_motif: type === 'CPAM' ? medicalMotif : null,
        transport_type: type === 'CPAM' ? transportType : null,
        return_trip: type === 'CPAM' ? returnTrip : false,
        return_time: null,
        companion: false,
        passengers: passengers ?? null,
        departure: departure.trim(),
        destination: destination.trim(),
        departure_lat: route.departureCoords?.lat ?? null,
        departure_lng: route.departureCoords?.lng ?? null,
        destination_lat: route.destinationCoords?.lat ?? null,
        destination_lng: route.destinationCoords?.lng ?? null,
        distance_km: route.distanceKm,
        duration_min: route.durationMin,
        static_duration_min: route.staticDurationMin,
        price_eur: canonicalPrice,
        price_min_eur: hasRange ? minNum : null,
        price_max_eur: hasRange ? maxNum : null,
        patient_name: patientName.trim() || null,
        phone: phone.trim() || null,
        notes: notes.trim() || null,
        scheduled_at,
        visibility,
        group_ids: visibility === 'GROUP' ? groupIds : [],
      };

      const errors = validateMission(payload);
      const first = errors[0];
      if (first) throw new Error(first.message);

      const created = await createMissionMobile(payload);
      if (opts?.share) {
        const msg = `Course à pourvoir\nDe : ${payload.departure}\nÀ : ${payload.destination}`;
        const url = `whatsapp://send?text=${encodeURIComponent(msg)}`;
        Linking.openURL(url).catch(() => undefined);
      }
      setPublished(true);
      return created.id;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la publication';
      setError(msg);
      reportError(err, { tags: { phase: 'poster-submit' } });
      return null;
    } finally {
      setSaving(false);
    }
  }

  return {
    driverId,
    // gate
    gatePassed, setGatePassed, passGate,
    matchesSavedDefaults,
    /** Pré-réglages chargés depuis Supabase user_metadata. Null tant que pas
     * chargé, ou si l'utilisateur n'a jamais sauvé. Le shortcut Volume+ skip
     * l'étape 1 uniquement si savedDefaults?.type est défini. */
    savedDefaults,
    // type & visibility
    type, setType,
    visibility, groupIds,
    myGroups, loadingGroups, onSelectPublic, toggleGroup,
    // form fields
    when, setWhen, setWhenNow, setWhenLater,
    date, setDate, time, setTime,
    onChangeDate, onChangeTime,
    departure, setDeparture,
    destination, setDestination,
    // Pour brancher l'autocomplete : applique coords ET label
    onSelectDeparture: handleSelectDeparture,
    onSelectDestination: handleSelectDestination,
    patientName, setPatientName,
    phone, setPhone,
    notes, setNotes,
    price, setPrice,
    priceMin, setPriceMin, priceMax, setPriceMax,
    // Routing / pricing
    distanceKm: route.distanceKm,
    durationMin: route.durationMin,
    loadingRoute: route.loadingRoute,
    // Voice (gros mic global + 2 mics par champ d'adresse)
    voice,
    departureVoice, destinationVoice,
    /** True si n'importe quel mic (gros ou par champ) écoute actuellement. */
    voicesAnyListening: voice.isListening || departureVoice.isListening || destinationVoice.isListening,
    /** True si n'importe quel pipeline IA tourne (Whisper + Places ou Whisper + GPT). */
    voicesAnyProcessing: voice.isProcessing || departureVoice.isProcessing || destinationVoice.isProcessing,
    /** Arrête le mic actif (sert au bouton X du bandeau d'enregistrement). */
    stopAllVoiceListening: () => {
      if (voice.isListening) voice.toggle();
      if (departureVoice.isListening) departureVoice.toggle();
      if (destinationVoice.isListening) destinationVoice.toggle();
    },
    // CPAM
    medicalMotif, setMedicalMotif,
    returnTrip, setReturnTrip,
    tpmr, setTpmr,
    passengers, setPassengers,
    // PRIVE supplements
    extraBagages, setExtraBagages,
    extraEncombrants, setExtraEncombrants,
    // submit state
    canContinue, canSubmit,
    saving, error, published,
    previewFare,
    submit,
    // Reset
    resetForm, hasAnyContent,
  };
}

export type PosterCourseState = ReturnType<typeof usePosterCourse>;
