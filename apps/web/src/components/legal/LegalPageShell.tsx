import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, AlertTriangle } from 'lucide-react'

interface Props {
  title: string
  lastUpdated: string
  children: React.ReactNode
}

const RELATED = [
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/confidentialite', label: 'Confidentialité' },
  { href: '/cgu', label: 'CGU' },
  { href: '/rgpd', label: 'RGPD' },
]

export function LegalPageShell({ title, lastUpdated, children }: Props) {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-warm-200 bg-paper sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Retour à l'accueil" className="flex items-center gap-2 text-warm-600 hover:text-ink transition-colors text-[14px] font-semibold">
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            <Image src="/brand/icon.svg" alt="" width={28} height={28} className="w-7 h-7" />
            <span>Accueil</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 md:px-8 py-8 md:py-12">
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" strokeWidth={2} />
          <div className="text-[13px] leading-relaxed text-amber-900">
            <p className="font-semibold">Version provisoire en cours de validation juridique.</p>
            <p className="mt-1">
              Ce document est un brouillon basé sur l&apos;activité actuelle de TaxiLink. Il
              <strong> doit être validé par un conseil juridique </strong>avant d&apos;être considéré
              comme contractuel. Pour toute question : <a href="mailto:support@taxilink.fr" className="underline font-semibold">support@taxilink.fr</a>.
            </p>
          </div>
        </div>

        <article className="prose-legal">
          <h1 className="text-[28px] md:text-[34px] font-bold text-ink tracking-tight leading-tight mb-2">
            {title}
          </h1>
          <p className="text-[12.5px] text-warm-500 mb-8">
            Dernière mise à jour : {lastUpdated}
          </p>
          <div className="space-y-6 text-[14.5px] text-warm-800 leading-[1.7]">
            {children}
          </div>
        </article>

        <nav aria-label="Documents légaux" className="mt-12 pt-6 border-t border-warm-200 flex flex-wrap gap-3">
          {RELATED.map((r) => (
            <Link key={r.href} href={r.href} className="text-[12.5px] text-warm-600 hover:text-ink underline underline-offset-4 transition-colors">
              {r.label}
            </Link>
          ))}
          <a href="mailto:support@taxilink.fr" className="text-[12.5px] text-warm-600 hover:text-ink underline underline-offset-4 transition-colors">
            Contact
          </a>
        </nav>
      </main>
    </div>
  )
}
