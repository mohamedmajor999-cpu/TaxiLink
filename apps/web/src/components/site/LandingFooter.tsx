import Image from 'next/image'
import Link from 'next/link'

const PRODUCT = [
  { label: 'Fonctionnalités', href: '#produit' },
  { label: 'Démo',            href: '#etapes' },
  { label: 'Tarifs',          href: '#tarifs' },
]
const RESOURCES = [
  { label: "Centre d'aide", href: '#' },
  { label: 'Blog',          href: '#' },
  { label: 'Statut',        href: '#' },
]
const COMPANY = [
  { label: 'Contact',         href: '#' },
  { label: 'Confidentialité', href: '#' },
  { label: 'RGPD',            href: '#' },
]

export function LandingFooter() {
  return (
    <footer className="max-w-7xl mx-auto px-8 py-16 border-t border-warm-100">
      <div className="grid sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-12 pb-10">
        <div>
          <Link href="/" className="flex items-center" aria-label="TaxiLink Pro">
            <Image src="/brand/logo-with-tagline.svg" alt="TaxiLink Pro" width={360} height={80} className="h-20 w-auto" />
          </Link>
          <p className="text-[14px] text-warm-500 mt-4 max-w-[28ch] leading-relaxed">
            L&apos;outil métier des chauffeurs de taxi français. Fabriqué à Marseille.
          </p>
        </div>

        <FooterCol title="Produit" links={PRODUCT} />
        <FooterCol title="Ressources" links={RESOURCES} />
        <FooterCol title="Entreprise" links={COMPANY} />
      </div>

      <div className="border-t border-warm-100 pt-5 flex justify-between flex-wrap gap-3.5 text-[12.5px] text-warm-500">
        <span>© 2026 TaxiLink. Hébergé en France.</span>
        <span>v. 2.4.1</span>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: Array<{ label: string; href: string }> }) {
  return (
    <div>
      <h5 className="text-[11.5px] font-bold uppercase tracking-[1.5px] text-warm-500 mb-3.5">{title}</h5>
      <ul className="flex flex-col gap-2.5">
        {links.map(({ label, href }) => (
          <li key={label}>
            <a href={href} className="text-[14px] text-warm-600 hover:text-ink transition-colors">{label}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
