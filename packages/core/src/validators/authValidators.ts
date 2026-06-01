// Validateurs generiques reutilisables (auth, formulaires divers).
// Cross-platform : aucune dependance DOM ni Node, fonctions pures.

export const PHONE_REGEX = /^(\+33|0)[1-9]\d{8}$/

export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone.replace(/\s/g, ''))
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Politique mot de passe alignée sur la recommandation CNIL (délibération 2022-100)
// pour une auth par mot de passe SANS vérification anti-fuite côté serveur. On
// privilégie la LONGUEUR à la complexité par symboles (meilleure protection, moins
// de friction au clavier mobile) : 14 caractères minimum + au moins une minuscule,
// une majuscule et un chiffre (pas de symbole imposé).
// Doit rester synchrone avec le réglage Supabase Auth (Minimum password length = 14
// + Password requirements = « Lowercase, uppercase letters and digits ») — sinon
// l'app accepte un mot de passe que le serveur refuse (ou l'inverse). Cf. audit L-01.
export const PASSWORD_MIN_LENGTH = 14
export const PASSWORD_RULE_LABEL =
  '14 caractères minimum, avec au moins une majuscule, une minuscule et un chiffre.'

export function isValidPassword(password: string): boolean {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password)
  )
}

// Prenom/nom : 2-50 caracteres, lettres latines (avec accents francais/europeens
// via la plage À-ſ), espaces, tirets, apostrophes. Refuse les chiffres
// et la ponctuation parasite. "Jean-Pierre", "D'Arc", "Francois-Xavier" passent,
// "Marc123" non. Pas de flag /u pour rester compatible avec target ES5.
export function isValidName(name: string): boolean {
  const trimmed = name.trim()
  if (trimmed.length < 2 || trimmed.length > 50) return false
  return /^[a-zA-ZÀ-ſ\s'-]+$/.test(trimmed)
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
