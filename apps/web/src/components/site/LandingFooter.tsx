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
    <footer id="landing-footer" className="max-w-7xl mx-auto px-5 md:px-8 py-10 md:py-16 pb-28 md:pb-16 border-t border-warm-100 pwa-safe-bottom">
      <div className="md:grid md:grid-cols-[2fr_1fr_1fr_1fr] md:gap-12 pb-8 md:pb-10">
        <div className="mb-8 md:mb-0">
          <Link href="/" className="flex items-center" aria-label="TaxiLink Pro">
            <Image src="/brand/logo-with-tagline.svg" alt="TaxiLink Pro" width={360} height={80} className="h-16 md:h-20 w-auto" />
          </Link>
          <p className="text-[14px] text-warm-500 mt-4 max-w-[28ch] leading-relaxed">
            L&apos;outil métier des chauffeurs de taxi français. Fabriqué à Marseille.
          </p>
        </div>

        <div className="md:contents">
          <FooterCol title="Produit" links={PRODUCT} />
          <FooterCol title="Ressources" links={RESOURCES} />
          <FooterCol title="Entreprise" links={COMPANY} />
        </div>
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
    <>
      <details className="md:hidden group border-y border-warm-100 -mt-px first:mt-0">
        <summary className="list-none cursor-pointer flex items-center justify-between py-4 select-none">
          <h5 className="text-[12.5px] font-bold uppercase tracking-[1.4px] text-warm-600">{title}</h5>
          <span aria-hidden className="w-7 h-7 rounded-full border border-warm-200 flex items-center justify-center text-warm-500 text-[16px] leading-none transition-transform group-open:rotate-45">+</span>
        </summary>
        <ul className="flex flex-col gap-3 pb-5 pt-1">
          {links.map(({ label, href }) => (
            <li key={label}>
              <a href={href} className="text-[15px] text-warm-600 active:text-ink">{label}</a>
            </li>
          ))}
        </ul>
      </details>
      <div className="hidden md:block">
        <h5 className="text-[11.5px] font-bold uppercase tracking-[1.5px] text-warm-500 mb-3.5">{title}</h5>
        <ul className="flex flex-col gap-2.5">
          {links.map(({ label, href }) => (
            <li key={label}>
              <a href={href} className="text-[14px] text-warm-600 hover:text-ink transition-colors">{label}</a>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
