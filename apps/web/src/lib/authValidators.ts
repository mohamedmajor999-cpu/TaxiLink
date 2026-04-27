// Validateurs génériques réutilisables (auth, formulaires divers)

export const PHONE_REGEX = /^(\+33|0)[1-9]\d{8}$/

export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone.replace(/\s/g, ''))
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8
}

// IBAN : 15-34 caracteres alphanumeriques, controle modulo 97 (norme ISO 7064).
export function isValidIban(iban: string): boolean {
  const cleaned = iban.replace(/\s+/g, '').toUpperCase()
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(cleaned)) return false
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4)
  // Convertit chaque lettre en deux chiffres (A=10, ..., Z=35).
  const numeric = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55))
  // Modulo 97 sur grand entier en parcourant par blocs.
  let remainder = 0
  for (let i = 0; i < numeric.length; i += 7) {
    remainder = Number(String(remainder) + numeric.slice(i, i + 7)) % 97
  }
  return remainder === 1
}

export function formatIban(iban: string): string {
  return iban.replace(/\s+/g, '').toUpperCase().replace(/(.{4})/g, '$1 ').trim()
}
