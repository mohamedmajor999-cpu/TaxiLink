'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useLandingNav } from './useLandingNav'

const NAV_LINKS = [
  { label: 'Produit', href: '#produit' },
  { label: 'Comment ça marche', href: '#etapes' },
  { label: 'Tarifs', href: '#tarifs' },
  { label: 'FAQ', href: '#faq' },
]

export function LandingNav() {
  const { menuOpen, openMenu, closeMenu } = useLandingNav()

  return (
    <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-warm-100 pwa-safe-top">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 md:h-[80px] flex items-center justify-between">

        <Link href="/" className="flex items-center" aria-label="TaxiLink Pro">
          <Image src="/brand/logo-with-tagline.svg" alt="TaxiLink Pro" width={320} height={70} priority className="h-12 md:h-[64px] w-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, href }) => (
            <a key={href} href={href} className="text-[14px] font-medium text-warm-600 hover:text-ink transition-colors">
              {label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2.5">
          <Link href="/auth/login" className="text-[14px] font-semibold text-warm-600 hover:text-ink px-4 py-2.5 transition-colors">
            Se connecter
          </Link>
          <Link href="/auth/register" className="text-[14px] font-semibold text-white bg-ink px-4 py-2.5 rounded-lg hover:bg-warm-800 transition-all hover:-translate-y-px">
            S&apos;inscrire
          </Link>
        </div>

        <button onClick={openMenu} className="md:hidden p-2 rounded-lg hover:bg-warm-50 transition-colors" aria-label="Ouvrir le menu">
          <Menu size={20} />
        </button>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40" onClick={closeMenu}>
          <div className="absolute right-0 top-0 h-full w-72 bg-white p-6 shadow-toast" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <span className="font-bold text-ink">Menu</span>
              <button onClick={closeMenu} className="p-2 rounded-lg hover:bg-warm-50 transition-colors" aria-label="Fermer">
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
              <Link href="/auth/login" onClick={closeMenu} className="text-sm font-semibold text-center text-ink px-4 py-2.5 rounded-lg border border-warm-200 hover:bg-warm-50 transition-colors">
                Se connecter
              </Link>
              <Link href="/auth/register" onClick={closeMenu} className="text-sm font-semibold text-center text-white px-4 py-2.5 rounded-lg bg-ink hover:bg-warm-800 transition-colors">
                S&apos;inscrire
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
