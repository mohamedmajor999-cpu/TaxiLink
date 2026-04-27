import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'

export function Footer() {
  return (
    <footer className="bg-white border-t border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center mb-4" aria-label="TaxiLink Pro">
              <Image src="/brand/logo-primary.svg" alt="TaxiLink Pro" width={202} height={36} className="h-9 w-auto" />
            </Link>
            <p className="text-muted text-sm leading-relaxed max-w-xs">
              La plateforme d&apos;échange de courses entre chauffeurs professionnels. Hôpital, privé — sans WhatsApp.
            </p>
          </div>
          <div>
            <div className="text-xs font-bold text-secondary uppercase tracking-wider mb-4">Plateforme</div>
            <div className="space-y-2.5">
              {[
                { href: '/auth/register?role=driver', label: 'Rejoindre en tant que chauffeur' },
                { href: '/telecharger',               label: 'Télécharger l\'app'              },
              ].map(l => (
                <Link key={l.href} href={l.href} className="block text-sm text-muted hover:text-secondary transition-colors">{l.label}</Link>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-secondary uppercase tracking-wider mb-4">Légal</div>
            <div className="space-y-2.5">
              {['Mentions légales', 'CGU', 'Confidentialité', 'RGPD', 'Contact'].map(l => (
                <Link key={l} href="#" className="block text-sm text-muted hover:text-secondary transition-colors">{l}</Link>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-line pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted">© 2026 TaxiLink Pro. Tous droits réservés.</p>
          <div className="flex items-center gap-2 text-xs text-muted">
            <Icon name="lock" size={14} />
            <span>100% gratuit · Données sécurisées · France</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
