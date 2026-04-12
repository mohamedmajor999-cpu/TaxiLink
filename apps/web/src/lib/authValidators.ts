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
