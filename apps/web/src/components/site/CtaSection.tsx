import Link from 'next/link'

export function CtaSection() {
  return (
    <section className="py-20 md:py-28 bg-warm-50">
      <div className="max-w-3xl mx-auto px-6 text-center">

        <h2 className="font-serif text-display-md text-ink mb-4">
          Votre réseau mérite<br />
          <em className="italic">mieux que WhatsApp</em>.
        </h2>

        <p className="text-base text-warm-600 mb-8 leading-relaxed">
          Aucune carte bleue. Aucun engagement.<br />
          Inscription en 2 minutes avec votre carte pro.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/auth/register"
            className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-brand text-ink font-semibold text-sm hover:bg-brand/90 transition-colors duration-150">
            Commencer gratuitement →
          </Link>
          <Link href="/auth/login"
            className="inline-flex items-center justify-center h-12 px-8 rounded-xl border border-warm-200 text-ink font-semibold text-sm hover:bg-warm-100 transition-colors duration-150">
            Voir la démo
          </Link>
        </div>

      </div>
    </section>
  )
}
