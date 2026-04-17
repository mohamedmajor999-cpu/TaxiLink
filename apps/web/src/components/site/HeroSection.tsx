import Link from 'next/link'
import { PhoneMockup } from './PhoneMockup'

const AVATARS = [
  { initials: 'PM', label: 'Pascal M.' },
  { initials: 'KB', label: 'Karim B.' },
  { initials: 'SR', label: 'Samir R.' },
  { initials: 'ML', label: 'Marie L.' },
]

export function HeroSection() {
  return (
    <section className="min-h-screen bg-paper flex items-center py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 w-full">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left — texte + CTAs */}
          <div className="order-2 md:order-1">
            <div className="inline-flex items-center gap-2 bg-warm-100 px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand" />
              <span className="text-xs font-semibold text-warm-600">128 chauffeurs actifs à Marseille</span>
            </div>

            <h1 className="font-serif text-display-lg lg:text-display-xl text-ink mb-6 leading-none">
              Fini WhatsApp.<br />
              Échangez vos<br />
              courses entre <em className="italic">pros</em>.
            </h1>

            <p className="text-base text-warm-600 leading-relaxed mb-8 max-w-md">
              Postez une course médicale ou privée à la voix en 30 secondes.
              Un collègue la récupère, vous êtes notifié, elle s&apos;ajoute à son agenda.
              Sans appel. Sans groupe WhatsApp.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link href="/auth/register"
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-brand text-ink font-semibold text-sm hover:bg-brand/90 transition-colors duration-150">
                Commencer gratuitement →
              </Link>
              <Link href="/auth/register?flotte=true"
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl border border-warm-200 text-ink font-semibold text-sm hover:bg-warm-50 transition-colors duration-150">
                Je gère une flotte
              </Link>
            </div>

            {/* Trust line */}
            <div className="flex items-center gap-3">
              <div className="flex">
                {AVATARS.map((a, i) => (
                  <div key={a.initials}
                    className="w-8 h-8 rounded-full bg-warm-200 border-2 border-paper flex items-center justify-center text-[10px] font-bold text-ink"
                    style={i > 0 ? { marginLeft: '-8px' } : {}}
                    title={a.label}>
                    {a.initials}
                  </div>
                ))}
              </div>
              <p className="text-xs text-warm-500 font-medium">
                Rejoignez les chauffeurs pros qui ont quitté WhatsApp
              </p>
            </div>
          </div>

          {/* Right — mockup téléphone */}
          <div className="order-1 md:order-2 flex justify-center md:justify-end">
            <PhoneMockup />
          </div>

        </div>
      </div>
    </section>
  )
}
