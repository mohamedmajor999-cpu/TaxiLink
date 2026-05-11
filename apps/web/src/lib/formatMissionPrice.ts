/**
 * Format d'affichage pour le prix d'une mission.
 * - Si une fourchette est renseignée et les bornes diffèrent → "45–75 €"
 * - Sinon → valeur unique "60,00€"
 *
 * Utilisé par toutes les listes de missions (grid dispo, agenda, stats, banner).
 */
interface PriceFields {
  price_eur: number | null
  price_min_eur?: number | null
  price_max_eur?: number | null
}

export function formatMissionPrice(m: PriceFields, opts: { decimals?: boolean } = {}): string {
  const { price_min_eur: lo, price_max_eur: hi } = m
  if (lo != null && hi != null) {
    // Fourchette si bornes diffèrent, sinon valeur certaine (lo == hi). Avant
    // on retombait sur price_eur dans le cas egal, ce qui affichait "—" si
    // price_eur etait null alors qu'on avait pourtant lo=hi=50.
    if (lo !== hi) return `${lo}–${hi}€`
    return opts.decimals ? `${lo.toFixed(2)}€` : `${lo}€`
  }
  if (m.price_eur == null) return '—'
  return opts.decimals ? `${m.price_eur.toFixed(2)}€` : `${m.price_eur}€`
}
