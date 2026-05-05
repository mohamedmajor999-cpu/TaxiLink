/**
 * Normalise un numéro pour wa.me : digits-only, format français "0XYZ" ramené
 * à "33XYZ". Si déjà international (commence par autre chose), on laisse.
 */
export function waNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0') && digits.length === 10) return '33' + digits.slice(1)
  return digits
}
