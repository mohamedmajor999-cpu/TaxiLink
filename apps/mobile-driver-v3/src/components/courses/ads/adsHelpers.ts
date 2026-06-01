import type { Mission } from '@taxilink/supabase-types';

// Réplique apps/web/.../ads/adsHelpers.ts (ports state derivation + tracker step + day grouping).

export type AdState = 'waiting' | 'expired' | 'accepted' | 'done';
export type TrackerStep = 'accepted' | 'enroute' | 'onboard' | 'done';

export interface DriverProfile {
  full_name: string | null;
  phone: string | null;
}

export interface AdView {
  mission: Mission;
  state: AdState;
  driver: DriverProfile | null;
}

export interface AdDayGroup {
  key: string;
  date: Date;
  label: string;
  ads: AdView[];
  total: number;
}

export function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function startOfWeek(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  r.setDate(r.getDate() + diff);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function agendaDayLabel(d: Date, today: Date, tomorrow: Date): string {
  const dayMonth = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  if (sameDay(d, today)) return `Aujourd'hui · ${dayMonth}`;
  if (sameDay(d, tomorrow)) return `Demain · ${dayMonth}`;
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function getAdState(m: Mission, now: number = Date.now()): AdState {
  if (m.status === 'DONE') return 'done';
  if (m.status === 'AVAILABLE') {
    return new Date(m.scheduled_at).getTime() < now ? 'expired' : 'waiting';
  }
  return 'accepted';
}

export function relativeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)} j`;
}

export function deriveTrackerStep(m: Mission, now: number): TrackerStep {
  if (m.status === 'DONE' || m.dropoff_at) return 'done';
  if (new Date(m.scheduled_at).getTime() > now) return 'accepted';
  if (m.pickup_at) return 'onboard';
  if (m.enroute_at) {
    const enrouteMs = new Date(m.enroute_at).getTime();
    const trajetPatientMs = (m.duration_min ?? 20) * 60_000;
    if (now >= enrouteMs + trajetPatientMs) return 'onboard';
    return 'enroute';
  }
  return 'accepted';
}

// 3 jours passés + aujourd'hui + 13 jours futurs ; on n'expose que les jours qui ont au moins 1 annonce.
export function buildAdDays(ads: AdView[]): AdDayGroup[] {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const start = addDays(today, -3);
  const groups: AdDayGroup[] = [];
  for (let i = 0; i < 17; i++) {
    const d = addDays(start, i);
    const dayAds = ads
      .filter((a) => sameDay(new Date(a.mission.scheduled_at), d))
      .sort((a, b) => new Date(a.mission.scheduled_at).getTime() - new Date(b.mission.scheduled_at).getTime());
    if (dayAds.length === 0) continue;
    groups.push({
      key: d.toDateString(),
      date: d,
      label: agendaDayLabel(d, today, tomorrow),
      ads: dayAds,
      total: dayAds.reduce((s, a) => s + Number(a.mission.price_eur ?? 0), 0),
    });
  }
  return groups;
}

const FR_DAY_SHORT = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];

export interface WeekDayCell {
  date: Date;
  dayShort: string;
  count: number;
  key: string;
  disabled?: boolean;
}

export function buildWeekDays(weekStart: Date, ads: AdView[]): WeekDayCell[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const count = ads.filter((a) => sameDay(new Date(a.mission.scheduled_at), d)).length;
    return { date: d, dayShort: FR_DAY_SHORT[d.getDay()]!, count, key: d.toDateString() };
  });
}

export const FR_DAY_SHORT_PUB = FR_DAY_SHORT;
