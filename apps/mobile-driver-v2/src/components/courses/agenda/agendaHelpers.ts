import type { Mission } from '@taxilink/supabase-types';
import { computeDisplayFare } from '@taxilink/core';
import {
  FR_DAY_SHORT_PUB,
  addDays,
  agendaDayLabel,
  sameDay,
  startOfDay,
} from '../ads/adsHelpers';

// Réplique apps/web/.../agendaHelpers.ts (subset utile pour mobile : toEvent + buildAgendaDays).

export type AgendaEventStatus = 'completed' | 'now' | 'scheduled' | 'manual';

export interface AgendaEvent {
  id: string;
  start: Date;
  end: Date;
  status: AgendaEventStatus;
  type: 'CPAM' | 'PRIVE' | 'TAXILINK';
  from: string;
  to: string;
  priceEur: number;
  isManual: boolean;
  patientName: string | null;
  returnTrip: boolean;
}

export interface AgendaDayGroup {
  key: string;
  date: Date;
  label: string;
  events: AgendaEvent[];
  total: number;
  count: number;
}

export interface AgendaWeekDay {
  date: Date;
  dayShort: string;
  count: number;
  key: string;
  disabled?: boolean;
}

// Fenêtre J → J+15 = 16 jours pendant lesquels une course manuelle peut être créée.
export const VISIBLE_DAYS = 16;
export const MAX_OFFSET = VISIBLE_DAYS - 1;

export function toEvent(m: Mission): AgendaEvent | null {
  const start = new Date(m.scheduled_at);
  const durationMin = Math.max(m.duration_min ?? Math.round((m.distance_km ?? 0) * 2.2), 15);
  const end = new Date(start.getTime() + durationMin * 60_000);
  const now = Date.now();
  const isManual = m.shared_by === null && m.client_id === null && m.status === 'ACCEPTED';
  const isCompleted = m.status === 'DONE' || end.getTime() < now;
  const isNow = start.getTime() <= now && end.getTime() >= now && !isCompleted;

  const status: AgendaEventStatus = isNow
    ? 'now'
    : isCompleted
      ? 'completed'
      : isManual
        ? 'manual'
        : 'scheduled';

  return {
    id: m.id,
    start,
    end,
    status,
    type: (['CPAM', 'PRIVE', 'TAXILINK'].includes(m.type) ? m.type : 'PRIVE') as AgendaEvent['type'],
    from: m.departure,
    to: m.destination,
    priceEur: computeDisplayFare(m as never).value,
    isManual,
    patientName: m.patient_name,
    returnTrip: m.return_trip,
  };
}

export function buildAgendaDays(missions: Mission[], today: Date): AgendaDayGroup[] {
  const tomorrow = addDays(today, 1);
  return Array.from({ length: VISIBLE_DAYS }, (_, i) => {
    const d = addDays(today, i);
    const dayEvents = missions
      .filter((m) => sameDay(new Date(m.scheduled_at), d))
      .map((m) => toEvent(m))
      .filter((e): e is AgendaEvent => e !== null)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    return {
      key: d.toDateString(),
      date: d,
      label: agendaDayLabel(d, today, tomorrow),
      events: dayEvents,
      count: dayEvents.length,
      total: dayEvents.reduce((s, e) => s + e.priceEur, 0),
    };
  });
}

export function buildAgendaWeekDays(weekStart: Date, missions: Mission[], today: Date, maxDate: Date): AgendaWeekDay[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const count = missions.filter((m) => sameDay(new Date(m.scheduled_at), d)).length;
    const inWindow = d.getTime() >= today.getTime() && d.getTime() <= maxDate.getTime();
    return {
      date: d,
      dayShort: FR_DAY_SHORT_PUB[d.getDay()]!,
      count,
      key: d.toDateString(),
      disabled: !inWindow,
    };
  });
}

export function weekRangeLabel(weekDays: AgendaWeekDay[]): string {
  const start = weekDays[0]!.date;
  const end = weekDays[6]!.date;
  if (start.getMonth() === end.getMonth()) {
    const month = end.toLocaleDateString('fr-FR', { month: 'long' });
    return `Semaine du ${start.getDate()} au ${end.getDate()} ${month}`;
  }
  const ms = start.toLocaleDateString('fr-FR', { month: 'long' });
  const me = end.toLocaleDateString('fr-FR', { month: 'long' });
  return `Semaine du ${start.getDate()} ${ms} au ${end.getDate()} ${me}`;
}

export { addDays, agendaDayLabel, sameDay, startOfDay };
