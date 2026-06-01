import { estimateCpamFare, estimateMarseilleFareRange } from '@taxilink/core';
import type { MedicalMotif, TransportType } from '@taxilink/core';

export type EffectivePrice =
  | { kind: 'fixed'; value: number }
  | { kind: 'range'; min: number; max: number };

interface Args {
  price: string;
  priceMin: string;
  priceMax: string;
  type: 'CPAM' | 'PRIVE';
  medicalMotif: MedicalMotif | null;
  distanceKm: number | null;
  durationMin: number | null;
  staticDurationMin?: number | null;
  date: string;
  time: string;
  departure: string;
  destination: string;
  passengers?: number | null;
  transportType?: TransportType | null;
  returnTrip?: boolean;
  extraBagages?: number | null;
  extraEncombrants?: number | null;
}

const parseNum = (s: string): number | null => {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : null;
};

/** Port mobile de computeEffectivePrice PWA — calculs purs, sans DOM. */
export function computeEffectivePrice(args: Args): EffectivePrice | null {
  if (args.type === 'PRIVE') {
    const min = parseNum(args.priceMin);
    const max = parseNum(args.priceMax);
    if (min != null && max != null) {
      return min === max ? { kind: 'fixed', value: min } : { kind: 'range', min, max };
    }
  }
  const fixed = parseNum(args.price);
  if (fixed != null) return { kind: 'fixed', value: fixed };

  if (args.type === 'CPAM' && args.medicalMotif) {
    const v = estimateCpamFare({
      distanceKm: args.distanceKm,
      durationMin: args.durationMin,
      date: args.date,
      time: args.time,
      medicalMotif: args.medicalMotif,
      departure: args.departure,
      destination: args.destination,
      passengers: args.passengers,
      transportType: args.transportType,
      returnTrip: args.returnTrip,
    });
    return v != null ? { kind: 'fixed', value: v } : null;
  }

  if (args.type === 'PRIVE') {
    const r = estimateMarseilleFareRange({
      distanceKm: args.distanceKm,
      durationMin: args.durationMin,
      staticDurationMin: args.staticDurationMin ?? null,
      date: args.date,
      time: args.time,
      departure: args.departure,
      destination: args.destination,
      passengers: args.passengers,
      extraBagages: args.extraBagages,
      extraEncombrants: args.extraEncombrants,
    });
    if (r == null) return null;
    return r.min === r.max ? { kind: 'fixed', value: r.min } : { kind: 'range', min: r.min, max: r.max };
  }
  return null;
}
