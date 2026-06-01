// Helpers purs du formulaire de publication (audit L-22 : sortis de
// usePosterCourse pour alléger le hook et les rendre testables isolément).
// Aucune dépendance React/Supabase : date/heure par défaut + parsing.

/** Date du jour au format `YYYY-MM-DD` (fuseau local). */
export function defaultDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Heure « maintenant + 30 min », arrondie au quart d'heure supérieur, en `HH:MM`. */
export function defaultTime(): string {
  const d = new Date(Date.now() + 30 * 60_000);
  const m = Math.ceil(d.getMinutes() / 15) * 15;
  d.setMinutes(m % 60, 0, 0);
  if (m >= 60) d.setHours(d.getHours() + 1);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Combine une date `YYYY-MM-DD` et une heure `H:MM`/`HH:MM` en ISO string
 * (fuseau local → UTC). Retourne null si le format est invalide ou la date
 * impossible.
 */
export function buildScheduledAt(date: string, time: string): string | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!dateMatch || !timeMatch) return null;
  const [, y, mo, da] = dateMatch;
  const [, hh, mm] = timeMatch;
  const d = new Date(Number(y), Number(mo) - 1, Number(da), Number(hh), Number(mm), 0, 0);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Parse un prix saisi (« 12,50 » ou « 12.50 ») en nombre ≥ 0, sinon null. */
export function parsePrice(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : null;
}
