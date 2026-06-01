// Trackers anti-doublon bornés (audit I-22).
//
// Les hooks d'offre/alerte gardent les ids déjà vus dans un Set<string> pour
// dédupliquer les events Realtime livrés 2x (reconnexion de channel). Ces Set
// n'évinçaient jamais → croissance illimitée sur une session longue (shift 12h
// = des milliers d'ids retenus pour rien). Ici on borne la taille en évinçant
// les plus anciens (les Set JS conservent l'ordre d'insertion).

/** Plafond par défaut : largement au-delà du nombre de missions/offres
 * distinctes qu'un chauffeur croise dans une fenêtre où la dédup compte. */
export const DEFAULT_DEDUP_CAP = 500;

/**
 * Ajoute `id` à `set` en bornant sa taille à `max`. Au-delà, évince les
 * entrées les plus anciennes. Remplace `set.add(id)` à l'identique côté appel
 * (le `.has()` de dédup reste inchangé).
 */
export function rememberBounded(set: Set<string>, id: string, max = DEFAULT_DEDUP_CAP): void {
  set.add(id);
  if (set.size <= max) return;
  const it = set.values();
  for (let excess = set.size - max; excess > 0; excess--) {
    const oldest = it.next().value;
    if (oldest === undefined) break;
    set.delete(oldest);
  }
}
