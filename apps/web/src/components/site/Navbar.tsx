'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-xl font-black text-secondary">
              T
            </div>
            <span className="text-lg font-black text-secondary tracking-tight">
              TaxiLink <span className="text-primary">Pro</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#fonctionnalites" className="text-sm font-semibold text-muted hover:text-secondary transition-colors">Fonctionnalités</Link>
            <Link href="#comment-ca-marche" className="text-sm font-semibold text-muted hover:text-secondary transition-colors">Comment ça marche</Link>
            <Link href="#temoignages" className="text-sm font-semibold text-muted hover:text-secondary transition-colors">Avis</Link>
            <Link href="/telecharger" className="text-sm font-semibold text-muted hover:text-secondary transition-colors">Télécharger l'app</Link>
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm font-semibold text-secondary hover:text-primary transition-colors px-4 py-2"
            >
              Se connecter
            </Link>
            <Link
              href="/auth/register"
              className="h-9 px-5 rounded-xl bg-primary font-bold text-sm text-secondary hover:bg-yellow-400 transition-colors btn-ripple flex items-center"
            >
              Commencer gratuitement
            </Link>
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center hover:bg-bgsoft"
            aria-label="Menu"
          >
            <Icon name={open ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-line bg-white px-4 py-4 space-y-2">
          {[
            { href: '#fonctionnalites', label: 'Fonctionnalités' },
            { href: '#comment-ca-marche', label: 'Comment ça marche' },
            { href: '#temoignages', label: 'Avis' },
            { href: '/telecharger', label: 'Télécharger l\'app' },
          ].map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="block py-2.5 text-sm font-semibold text-secondary">{l.label}</Link>
          ))}
          <div className="pt-2 border-t border-line flex flex-col gap-2">
            <Link href="/auth/login" className="block text-center py-2.5 text-sm font-semibold text-secondary border border-line rounded-xl">
              Se connecter
            </Link>
            <Link href="/auth/register" className="block text-center py-3 text-sm font-bold bg-primary text-secondary rounded-xl">
              Commencer gratuitement
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
