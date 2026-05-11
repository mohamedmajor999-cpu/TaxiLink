import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Whitelist symetrique a safeDashboardRedirect cote client. Sans validation,
// un lien callback legitime pouvait pointer vers une route interne arbitraire
// (?next=/api/users/export) — pas un open redirect (URL parser bloque l'externe)
// mais incoherence avec la whitelist client.
const ALLOWED_NEXT_PREFIXES = ['/dashboard/', '/auth/reset-password', '/rejoindre/', '/invite/']

function safeNext(raw: string | null): string {
  const fallback = '/dashboard/chauffeur'
  if (!raw) return fallback
  if (raw.startsWith('//')) return fallback
  if (!raw.startsWith('/')) return fallback
  if (!ALLOWED_NEXT_PREFIXES.some((p) => raw.startsWith(p))) return fallback
  return raw
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`)
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (!error) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  console.error('[auth/callback] exchangeCodeForSession failed:', error.message, '— next was:', next)
  const reason = encodeURIComponent(error.message)
  // Pour un flow recovery, renvoyer vers forgot-password avec l'erreur visible
  // plutôt que login (sinon le user croit que c'est ses identifiants).
  const fallback = next.startsWith('/auth/reset-password')
    ? `/auth/forgot-password?error=exchange&reason=${reason}`
    : `/auth/login?error=exchange&reason=${reason}`
  return NextResponse.redirect(`${origin}${fallback}`)
}
