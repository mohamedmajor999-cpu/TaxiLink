'use client'

import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useLandingNav } from './useLandingNav'

const NAV_LINKS = [
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Comment ça marche', href: '#how-it-works' },
  { label: 'Témoignages', href: '#testimonials' },
  { label: 'Patrons de flotte', href: '#pricing' },
]

export function LandingNav() {
  const { menuOpen, openMenu, closeMenu } = useLandingNav()

  return (
    <nav className="sticky top-0 z-50 bg-paper border-b border-warm-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-ink rounded-lg flex items-center justify-center">
            <div className="w-3 h-3 bg-brand rounded-sm" />
          </div>
          <span className="font-semibold text-ink text-base">TaxiLink</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, href }) => (
            <a key={href} href={href} className="text-sm text-warm-600 hover:text-ink transition-colors duration-150">
              {label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/auth/login" className="text-sm font-medium text-ink px-4 py-2 rounded-lg border border-warm-200 hover:bg-warm-50 transition-colors duration-150">
            Se connecter
          </Link>
          <Link href="/auth/register" className="text-sm font-medium text-ink px-4 py-2 rounded-lg bg-brand hover:bg-brand/90 transition-colors duration-150">
            Commencer →
          </Link>
        </div>

        <button onClick={openMenu} className="md:hidden p-2 rounded-lg hover:bg-warm-100 transition-colors" aria-label="Ouvrir le menu">
          <Menu size={20} />
        </button>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40" onClick={closeMenu}>
          <div className="absolute right-0 top-0 h-full w-72 bg-paper p-6 shadow-toast" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <span className="font-semibold text-ink">Menu</span>
              <button onClick={closeMenu} className="p-2 rounded-lg hover:bg-warm-100 transition-colors" aria-label="Fermer">
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map(({ label, href }) => (
                <a key={href} href={href} onClick={closeMenu}
                  className="px-3 py-2.5 rounded-lg text-sm text-warm-600 hover:bg-warm-50 hover:text-ink transition-colors">
                  {label}
                </a>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/auth/login" onClick={closeMenu} className="text-sm font-medium text-center text-ink px-4 py-2.5 rounded-lg border border-warm-200 hover:bg-warm-50 transition-colors">
                Se connecter
              </Link>
              <Link href="/auth/register" onClick={closeMenu} className="text-sm font-medium text-center text-ink px-4 py-2.5 rounded-lg bg-brand hover:bg-brand/90 transition-colors">
                Commencer gratuitement →
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
