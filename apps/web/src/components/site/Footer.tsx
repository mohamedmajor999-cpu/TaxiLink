import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'

export function Footer() {
  return (
    <footer className="bg-white border-t border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-xl font-black text-secondary">T</div>
              <span className="text-lg font-black text-secondary">TaxiLink <span className="text-primary">Pro</span></span>
            </Link>
            <p className="text-muted text-sm leading-relaxed max-w-xs mb-4">
              La plateforme d&apos;échange de courses entre chauffeurs professionnels. Hôpital, privé — sans WhatsApp.
            </p>
            <div className="flex gap-3">
              {['facebook', 'twitter', 'linkedin'].map(s => (
                <div key={s} className="w-8 h-8 rounded-lg bg-bgsoft flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
                  <Icon name="link" size={14} className="text-muted" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-secondary uppercase tracking-wider mb-4">Plateforme</div>
            <div className="space-y-2.5">
              {[
                { href: '#fonctionnalites',          label: 'Fonctionnalités'              },
                { href: '#comment-ca-marche',        label: 'Comment ça marche'            },
                { href: '/auth/register?role=driver', label: 'Rejoindre en tant que chauffeur' },
                { href: '/auth/register?role=patron', label: 'Gérer ma flotte'             },
                { href: '/telecharger',               label: 'Télécharger l\'app'          },
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
