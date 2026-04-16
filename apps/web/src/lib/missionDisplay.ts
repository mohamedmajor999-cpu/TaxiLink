export function getMissionTypeLabel(type: string): string {
  switch (type) {
    case 'CPAM': return 'CPAM'
    case 'PRIVE': return 'Privé'
    case 'TAXILINK': return 'TaxiLink'
    default: return type
  }
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
