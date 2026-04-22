/**
 * "Jean Dupont"              → "Jean D."
 * "Marie-Claire Dubois-Martin" → "Marie-Claire D."
 * "Jean"                     → "Jean"
 * null / vide                → null
 */
export function formatPublisherName(fullName: string | null | undefined): string | null {
  if (!fullName) return null
  const trimmed = fullName.trim()
  if (!trimmed) return null
  const parts = trimmed.split(/\s+/)
  const first = parts[0]
  if (parts.length === 1) return first
  const last = parts[parts.length - 1]
  return `${first} ${last.charAt(0).toUpperCase()}.`
}
