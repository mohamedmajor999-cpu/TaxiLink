// Helpers pour organizationService — token, normalisation tel, lien d'invitation.

export function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '')
  if (digits.startsWith('0')) return '+33' + digits.slice(1)
  if (digits.startsWith('+')) return digits
  if (digits.startsWith('33')) return '+' + digits
  return digits
}

export function buildInvitationLink(token: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://taxi-link-web.vercel.app'
  return `${origin}/invite/${token}`
}
