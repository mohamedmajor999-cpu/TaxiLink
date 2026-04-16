/** Estime la durée (min) et le prix (€) à partir d'une distance en km */
export function estimateTariff(distanceKm: number): { duration: number; price: number } {
  return {
    duration: Math.round(distanceKm * 2.5 + 5),
    price: distanceKm * 1.8 + 8,
  }
}

/** Simule une estimation de trajet (distance aléatoire 3–28 km, durée et prix dérivés) */
export function estimateRoute(): { distanceKm: number; duration: number; price: number } {
  const distanceKm = parseFloat((Math.random() * 25 + 3).toFixed(1))
  const { duration, price } = estimateTariff(distanceKm)
  return { distanceKm, duration, price }
}
