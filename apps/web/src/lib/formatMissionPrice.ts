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
  if (lo != null && hi != null && lo !== hi) {
    return `${lo}–${hi}€`
  }
  if (m.price_eur == null) return '—'
  return opts.decimals ? `${m.price_eur.toFixed(2)}€` : `${m.price_eur}€`
}
