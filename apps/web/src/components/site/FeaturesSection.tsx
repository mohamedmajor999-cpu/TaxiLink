import { Mic, Users, Calendar, Shield, BarChart2, Smartphone } from 'lucide-react'

const FEATURES = [
  {
    icon: Mic,
    title: 'Dictée vocale IA',
    desc: "Appuyez sur le micro et parlez. L'IA remplit l'adresse, l'heure, le prix. Vous validez et c'est posté.",
  },
  {
    icon: Users,
    title: 'Groupes privés',
    desc: "Créez des groupes entre chauffeurs de confiance. Vos collègues voient vos courses en premier. Les inconnus n'ont pas accès.",
  },
  {
    icon: Calendar,
    title: 'Agenda synchronisé',
    desc: "La course acceptée s'ajoute automatiquement à l'agenda. Zéro saisie, zéro oubli, tout est organisé sans effort.",
  },
  {
    icon: Shield,
    title: '100% RGPD',
    desc: "Pseudonymisation en mode public, codes de partage expirables, données stockées en France. Conforme CNIL.",
  },
  {
    icon: BarChart2,
    title: 'Stats & export',
    desc: "Suivez vos gains, km parcourus, gains réseau. Exportez en PDF pour votre comptable en un clic.",
  },
  {
    icon: Smartphone,
    title: 'PWA offline',
    desc: "Installable depuis le navigateur. Fonctionne hors ligne pour consulter vos courses. Aucun store à gérer.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28 bg-warm-50">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-warm-500 mb-3">Pour les chauffeurs</p>
          <h2 className="font-serif text-display-md text-ink mb-4">
            Votre réseau de collègues,<br />
            <em className="italic">organisé</em> et <em className="italic">fiable</em>.
          </h2>
          <p className="text-base text-warm-600 max-w-xl mx-auto leading-relaxed">
            Échangez des courses avec des chauffeurs que vous connaissez.
            Tout se passe dans l&apos;appli — zéro appel, zéro WhatsApp.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-paper border border-warm-200 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center mb-4">
                <Icon size={18} strokeWidth={1.6} className="text-ink" />
              </div>
              <h3 className="font-semibold text-ink text-base mb-2">{title}</h3>
              <p className="text-sm text-warm-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
