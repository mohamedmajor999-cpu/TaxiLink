import Link from 'next/link'

const PLATFORM_LINKS = ['Fonctionnalités', 'Comment ça marche', 'Télécharger la PWA', 'Pour les flottes']
const LEGAL_LINKS    = ['Mentions légales', 'CGU', 'Confidentialité', 'RGPD']
const CONTACT_LINKS  = ['contact@taxilink.fr', 'Support chauffeurs', 'Presse']

export function LandingFooter() {
  return (
    <footer className="bg-warm-50 border-t border-warm-200">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Col 1 — Marque */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-ink rounded-lg flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-brand rounded-sm" />
              </div>
              <span className="font-semibold text-ink text-sm">TaxiLink</span>
            </Link>
            <p className="text-xs text-warm-500 leading-relaxed">
              La plateforme d&apos;échange de courses entre chauffeurs professionnels.
              Marseille — France.
            </p>
          </div>

          {/* Col 2 — Plateforme */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-warm-500 mb-4">Plateforme</p>
            <ul className="space-y-2.5">
              {PLATFORM_LINKS.map(l => (
                <li key={l}><a href="#" className="text-sm text-warm-600 hover:text-ink transition-colors duration-150">{l}</a></li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Légal */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-warm-500 mb-4">Légal</p>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map(l => (
                <li key={l}><a href="#" className="text-sm text-warm-600 hover:text-ink transition-colors duration-150">{l}</a></li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Contact */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-warm-500 mb-4">Contact</p>
            <ul className="space-y-2.5">
              {CONTACT_LINKS.map(l => (
                <li key={l}><a href="#" className="text-sm text-warm-600 hover:text-ink transition-colors duration-150">{l}</a></li>
              ))}
            </ul>
          </div>

        </div>

        <div className="border-t border-warm-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-warm-500">© 2026 TaxiLink. Tous droits réservés.</p>
          <p className="text-xs text-warm-500">🔒 100% gratuit · Données sécurisées · Marseille, France 🌊</p>
        </div>
      </div>
    </footer>
  )
}
