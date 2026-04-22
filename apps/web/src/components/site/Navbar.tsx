'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { useNavbar } from './useNavbar'

export function Navbar() {
  const { open, toggle, close } = useNavbar()

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center" aria-label="TaxiLink Pro">
            <Image src="/brand/logo-primary.svg" alt="TaxiLink Pro" width={202} height={36} priority className="h-9 w-auto" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#fonctionnalites" className="text-sm font-semibold text-muted hover:text-secondary transition-colors">Fonctionnalités</Link>
            <Link href="#comment-ca-marche" className="text-sm font-semibold text-muted hover:text-secondary transition-colors">Comment ça marche</Link>
            <Link href="#temoignages" className="text-sm font-semibold text-muted hover:text-secondary transition-colors">Avis</Link>
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
            onClick={toggle}
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
            { href: '#fonctionnalites',   label: 'Fonctionnalités'    },
            { href: '#comment-ca-marche', label: 'Comment ça marche'  },
            { href: '#temoignages',       label: 'Avis'               },
          ].map(l => (
            <Link key={l.href} href={l.href} onClick={close}
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
