import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatEur(amount: number): string {
  return amount.toFixed(2).replace('.', ',') + '€'
}

export function formatKm(km: number): string {
  return km.toFixed(1) + ' km'
}

export function getMissionTypeLabel(type: string): string {
  switch (type) {
    case 'CPAM': return 'CPAM'
    case 'PRIVE': return 'Privé'
    case 'TAXILINK': return 'TaxiLink'
    default: return type
  }
}

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

export function getMissionTypeColors(type: string): { bg: string; text: string } {
  switch (type) {
    case 'CPAM':
      return { bg: 'bg-primary/20', text: 'text-secondary' }
    case 'PRIVE':
      return { bg: 'bg-secondary/10', text: 'text-secondary' }
    case 'TAXILINK':
      return { bg: 'bg-muted/20', text: 'text-secondary' }
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700' }
  }
}

export * from './dateUtils'
