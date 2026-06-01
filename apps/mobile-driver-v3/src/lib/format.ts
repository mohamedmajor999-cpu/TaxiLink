// Helpers de formatage d'affichage partagés. Centralisés ici car dupliqués à
// l'identique dans plusieurs composants (audit M-06).

/** Distance en km : 1 décimale sous 10 km, arrondi entier au-delà. Ex: 4.2 / 12. */
export function formatKm(km: number): string {
  return km < 10 ? km.toFixed(1) : km.toFixed(0);
}

/**
 * Durée lisible : `45 min` / `1h` / `2h 5` / `1j` / `1j 12h`. Format canonique
 * unique (audit M-06) — 4 variantes divergentes existaient (espaces, zero-pad
 * `1h05`, jours avec/sans heures restantes). Référence = la version testée de
 * `missionDetailHelpers` (cf. missionDetailHelpers.test.ts), + garde non-finie
 * (`—`) requise par les appelants qui passent `Infinity` (ex: MissionsCarousel).
 */
export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes)) return '—';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h < 24) return m === 0 ? `${h}h` : `${h}h ${m}`;
  const d = Math.floor(h / 24);
  const remH = h % 24;
  return remH === 0 ? `${d}j` : `${d}j ${remH}h`;
}
