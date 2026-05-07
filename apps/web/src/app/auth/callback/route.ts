import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard/chauffeur'

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
