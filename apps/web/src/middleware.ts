import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // 1. Non connecté → login
  if (!user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 2. Vérification du rôle pour les routes protégées
  if (pathname.startsWith('/dashboard/chauffeur') || pathname.startsWith('/dashboard/client')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    // Chauffeur essaie d'accéder au dashboard client → redirige vers son dashboard
    if (pathname.startsWith('/dashboard/client') && role !== 'client') {
      return NextResponse.redirect(new URL('/dashboard/chauffeur', request.url))
    }

    // Client essaie d'accéder au dashboard chauffeur → redirige vers son dashboard
    if (pathname.startsWith('/dashboard/chauffeur') && role !== 'driver') {
      return NextResponse.redirect(new URL('/dashboard/client', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
