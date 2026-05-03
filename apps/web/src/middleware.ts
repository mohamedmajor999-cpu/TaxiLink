import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Lit auth/role/profil depuis les claims JWT (decode local, ~1ms) au lieu de
// requeter Supabase a chaque navigation. Les claims `profile_complete` et
// `role` sont seedes dans `auth.users.raw_app_meta_data` par le trigger
// `sync_profile_claims_to_auth` (cf. migration 20260501).
//
// Si une session a ete emise avant le deploiement de la migration, les claims
// peuvent manquer ; on retombe alors sur une seule lecture DB pour preserver
// le comportement legacy. Apres rotation de token (~1h), tout passe par le JWT.
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Voir lib/supabase/client.ts : on force le maxAge a 1 an a chaque
      // rotation de cookie (le middleware re-emet les cookies a chaque
      // navigation quand le refresh token tourne).
      cookieOptions: {
        maxAge:   60 * 60 * 24 * 365,
        sameSite: 'lax',
        secure:   process.env.NODE_ENV === 'production',
        path:     '/',
      },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.getClaims()
  const claims = data?.claims
  const pathname = request.nextUrl.pathname

  // 1. Non connecte ou JWT invalide -> login
  if (error || !claims?.sub) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const userId = claims.sub
  const userEmail = (claims.email as string | undefined)?.toLowerCase().trim()
  const appMeta = (claims.app_metadata ?? {}) as { role?: string; profile_complete?: boolean }

  // 2. Dashboard admin : email == ADMIN_EMAIL.
  if (pathname.startsWith('/dashboard/admin')) {
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim()
    if (!adminEmail || userEmail !== adminEmail) {
      const role = appMeta.role ?? (await fetchProfileFallback(supabase, userId)).role
      const target = role === 'driver' ? '/dashboard/chauffeur' : '/dashboard/client'
      return NextResponse.redirect(new URL(target, request.url))
    }
    return supabaseResponse
  }

  // 3. Verification completude profil + role pour les routes protegees.
  if (
    pathname.startsWith('/dashboard/chauffeur')
    || pathname.startsWith('/dashboard/client')
    || pathname.startsWith('/dashboard/patron')
  ) {
    let role = appMeta.role
    let isComplete = appMeta.profile_complete

    // Fallback DB pour les sessions emises avant le seed des claims.
    if (role === undefined || isComplete === undefined) {
      const fallback = await fetchProfileFallback(supabase, userId)
      role = role ?? fallback.role
      isComplete = isComplete ?? fallback.complete
    }

    if (!isComplete) {
      const completeUrl = new URL('/auth/complete-profile', request.url)
      completeUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(completeUrl)
    }

    if (pathname.startsWith('/dashboard/client') && role !== 'client') {
      return NextResponse.redirect(new URL('/dashboard/chauffeur', request.url))
    }
    if (pathname.startsWith('/dashboard/chauffeur') && role !== 'driver') {
      return NextResponse.redirect(new URL('/dashboard/client', request.url))
    }
    // /dashboard/patron : verification membership deleguee au server component
    // (page.tsx) pour eviter une query DB sur chaque navigation middleware.
  }

  return supabaseResponse
}

async function fetchProfileFallback(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<{ role: string | undefined; complete: boolean }> {
  const { data } = await supabase
    .from('profiles')
    .select('role, first_name, last_name, phone')
    .eq('id', userId)
    .single()
  const profile = data as { role: string; first_name: string | null; last_name: string | null; phone: string | null } | null
  if (!profile) return { role: undefined, complete: false }
  const complete = !!(profile.first_name?.trim() && profile.last_name?.trim() && profile.phone?.trim())
  return { role: profile.role, complete }
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
