export function formatEur(amount: number): string {
  return amount.toFixed(2).replace('.', ',') + '€'
}

export function formatKm(km: number): string {
  return km.toFixed(1) + ' km'
}
