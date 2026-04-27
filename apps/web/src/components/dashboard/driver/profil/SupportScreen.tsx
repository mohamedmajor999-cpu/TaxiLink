'use client'
import { useState } from 'react'
import { ArrowLeft, Mail, Phone, MessageCircle, ChevronDown } from 'lucide-react'

interface Props {
  onBack: () => void
}

const SUPPORT_EMAIL = 'support@taxilink.fr'
const SUPPORT_PHONE = '+33 1 23 45 67 89'

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Comment recevoir des missions ?',
    a: 'Active ton statut « En ligne » depuis l’écran d’accueil et déclare au moins un département dans Profil → Départements couverts. Les missions visibles correspondent à tes zones d’activité.',
  },
  {
    q: 'Quand suis-je payé après une course ?',
    a: 'Les courses CPAM sont versées sous 7 jours ouvrés après validation. Les courses privées sont créditées sous 48 h sur le compte enregistré dans Profil → Compte bancaire.',
  },
  {
    q: 'Comment télécharger un reçu de course ?',
    a: 'Ouvre Profil → Factures & reçus, sélectionne la course concernée puis clique sur « Imprimer / PDF ». Le navigateur permet d’enregistrer le reçu au format PDF.',
  },
  {
    q: 'Mon document expire bientôt, que faire ?',
    a: 'Va dans Profil → Documents et utilise le bouton « Renouveler » sur le document concerné. Tu peux importer la nouvelle pièce avant l’expiration pour éviter toute interruption.',
  },
  {
    q: 'Comment partager une mission avec un autre chauffeur ?',
    a: 'Sur l’écran d’accueil, ouvre la course puis appuie sur « Partager ». Le partage se fait via le groupe Taxi13 ou par lien direct.',
  },
  {
    q: 'Comment changer mon IBAN ?',
    a: 'Ouvre Profil → Compte bancaire, saisis le nouvel IBAN et enregistre. La clé de contrôle est vérifiée immédiatement.',
  },
]

export function SupportScreen({ onBack }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <div className="max-w-2xl mx-auto">
      <header className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour"
          className="w-9 h-9 rounded-full grid place-items-center hover:bg-warm-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-ink" strokeWidth={2} />
        </button>
        <h1 className="text-[20px] font-bold text-ink leading-tight tracking-tight">
          Aide &amp; support
        </h1>
      </header>

      <section className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-warm-500 px-1 mb-2">
          Nous contacter
        </p>
        <div className="flex flex-col gap-2">
          <ContactRow
            icon={<Mail className="w-full h-full" strokeWidth={1.8} />}
            label="Email"
            value={SUPPORT_EMAIL}
            href={`mailto:${SUPPORT_EMAIL}?subject=Aide%20TaxiLink`}
          />
          <ContactRow
            icon={<Phone className="w-full h-full" strokeWidth={1.8} />}
            label="Téléphone"
            value={SUPPORT_PHONE}
            description="Lun–ven · 9 h–18 h"
            href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`}
          />
          <ContactRow
            icon={<MessageCircle className="w-full h-full" strokeWidth={1.8} />}
            label="WhatsApp"
            value="Réponse en moins d’une heure"
            href="https://wa.me/33123456789"
          />
        </div>
      </section>

      <section className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-warm-500 px-1 mb-2">
          Questions fréquentes
        </p>
        <div className="flex flex-col gap-2">
          {FAQ.map((item, idx) => {
            const open = openIdx === idx
            return (
              <div key={item.q} className="bg-paper border border-warm-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : idx)}
                  aria-expanded={open}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-warm-50 transition-colors"
                >
                  <span className="flex-1 text-[13px] font-semibold text-ink leading-snug">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-warm-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                    strokeWidth={2}
                  />
                </button>
                {open && (
                  <div className="px-4 pb-4 text-[12.5px] text-warm-700 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function ContactRow({
  icon, label, value, description, href,
}: {
  icon: React.ReactNode
  label: string
  value: string
  description?: string
  href: string
}) {
  return (
    <a
      href={href}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border bg-paper border-warm-200 hover:bg-warm-50 transition-colors"
    >
      <span className="w-9 h-9 rounded-xl bg-warm-100 text-warm-800 grid place-items-center shrink-0">
        <span className="w-[18px] h-[18px] grid place-items-center">{icon}</span>
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold text-ink leading-tight">{label}</div>
        <div className="text-[12px] text-warm-600 mt-0.5 truncate">{value}</div>
        {description && (
          <div className="text-[11px] text-warm-500 mt-0.5">{description}</div>
        )}
      </div>
    </a>
  )
}
