import { Icon } from '@/components/ui/Icon'

const features = [
  {
    icon: 'group',
    title: 'Réseau de collègues',
    desc: 'Échangez des courses avec des chauffeurs que vous connaissez. Fini WhatsApp, fini les appels — un collègue récupère votre course en un tap.',
    color: 'bg-yellow-50 text-yellow-600',
    highlight: true,
  },
  {
    icon: 'notifications_active',
    title: 'Confirmation automatique',
    desc: 'Dès qu\'un collègue récupère votre course, vous recevez une notification instantanée. Vous savez en temps réel que c\'est pris en charge.',
    color: 'bg-blue-50 text-blue-600',
    highlight: false,
  },
  {
    icon: 'calendar_month',
    title: 'Agenda synchronisé',
    desc: 'La course acceptée s\'ajoute automatiquement à l\'agenda du chauffeur. Zéro saisie, zéro oubli — tout est organisé sans effort.',
    color: 'bg-green-50 text-green-600',
    highlight: false,
  },
]

export function Features() {
  return (
    <section id="fonctionnalites" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-secondary/5 rounded-full px-4 py-2 mb-4">
            <Icon name="directions_car" size={16} className="text-secondary" />
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">Pour les chauffeurs</span>
          </div>
          <h2 className="text-4xl font-black text-secondary mb-4">Votre réseau, organisé et fiable.</h2>
          <p className="text-muted text-lg max-w-xl mx-auto">
            Échangez des courses avec des collègues de confiance. Zéro appel, zéro WhatsApp — tout se passe dans l&apos;appli.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map(f => (
            <div
              key={f.title}
              className={`p-8 rounded-2xl border transition-all group ${
                f.highlight
                  ? 'border-primary bg-primary/5 hover:shadow-card'
                  : 'border-line hover:border-primary/40 hover:shadow-card'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <Icon name={f.icon} size={26} />
              </div>
              <h3 className="font-black text-secondary text-xl mb-3">{f.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
