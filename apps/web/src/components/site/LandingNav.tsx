'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Menu, X } from 'lucide-react'
import { useLandingNav } from './useLandingNav'

const NAV_LINKS = [
  { label: 'Produit', href: '#produit' },
  { label: 'Installer', href: '#installer' },
  { label: 'Tarifs', href: '#tarifs' },
  { label: 'FAQ', href: '#faq' },
]

export function LandingNav() {
  const { menuOpen, openMenu, closeMenu } = useLandingNav()

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-warm-100/80 pwa-safe-top">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 md:h-[72px] flex items-center justify-between gap-6">

          <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="TaxiLink Pro — La plateforme de partage de course entre taxis">
            <Image src="/brand/icon.svg" alt="" width={56} height={56} priority className="h-12 md:h-14 w-12 md:w-14 shrink-0" />
            <div className="flex flex-col justify-center">
              <Image src="/brand/logo-wordmark.svg" alt="" width={220} height={43} priority className="h-8 md:h-9 w-auto" />
              <span className="text-[11px] md:text-[12px] font-medium text-warm-500 leading-tight mt-1 tracking-tight">
                La plateforme de partage de course entre taxis
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(({ label, href }) => (
              <a key={href} href={href} className="text-[14px] font-medium text-warm-600 hover:text-ink transition-colors">
                {label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link href="/auth/login" className="text-[14px] font-semibold text-ink bg-warm-100 hover:bg-warm-200 px-4 py-2 rounded-lg transition-colors">
              Se connecter
            </Link>
            <Link href="/auth/register" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-white bg-ink hover:bg-warm-800 px-4 py-2 rounded-lg transition-all hover:-translate-y-px shadow-sm hover:shadow-md">
              S&apos;inscrire
              <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>

          <button onClick={openMenu} className="md:hidden inline-flex items-center justify-center w-11 h-11 -mr-2 rounded-xl hover:bg-warm-50 active:bg-warm-100 transition-colors" aria-label="Ouvrir le menu">
            <Menu size={22} strokeWidth={2.2} />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden bg-[#ffffff] flex flex-col animate-fade-in pwa-safe-top pwa-safe-bottom">
          <div className="h-16 flex items-center justify-between px-5 border-b border-warm-100 shrink-0">
            <Link href="/" onClick={closeMenu} aria-label="TaxiLink Pro">
              <Image src="/brand/logo-with-tagline.svg" alt="TaxiLink Pro" width={245} height={56} className="h-11 w-auto" />
            </Link>
            <button onClick={closeMenu} className="inline-flex items-center justify-center w-11 h-11 -mr-2 rounded-xl hover:bg-warm-50 active:bg-warm-100 transition-colors" aria-label="Fermer">
              <X size={22} strokeWidth={2.2} />
            </button>
          </div>

          <nav className="flex-1 px-5 py-4 overflow-y-auto bg-[#ffffff]">
            <ul className="flex flex-col">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <a href={href} onClick={closeMenu}
                    className="flex items-center justify-between py-4 text-[22px] font-extrabold tracking-[-0.6px] text-ink border-b border-warm-100 active:text-warm-600">
                    {label}
                    <span aria-hidden className="text-warm-300 text-xl">→</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="px-5 pt-3 pb-5 border-t border-warm-100 flex flex-col gap-2.5 shrink-0 bg-[#ffffff]">
            <Link href="/auth/register" onClick={closeMenu} className="inline-flex items-center justify-center gap-2 text-[15px] font-semibold text-white px-5 py-4 rounded-2xl bg-ink active:scale-[0.98] transition-transform">
              S&apos;inscrire gratuitement
            </Link>
            <Link href="/auth/login" onClick={closeMenu} className="inline-flex items-center justify-center text-[14px] font-semibold text-warm-600 px-5 py-3">
              Déjà un compte ? <span className="ml-1 text-ink underline underline-offset-4 decoration-2 decoration-brand">Se connecter</span>
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
