import { Icon } from '@/components/ui/Icon'

const testimonials = [
  {
    name: 'Marc Fontaine',
    role: 'Chauffeur taxi indépendant, Paris',
    rating: 5,
    text: 'Avant je passais par un groupe WhatsApp de 30 personnes. C\'était le chaos. Maintenant je poste en 10 secondes et je reçois une notif quand c\'est pris. Révolutionnaire.',
    avatar: 'MF',
  },
  {
    name: 'Sabine Moreau',
    role: 'Chauffeure taxi, Lyon',
    rating: 5,
    text: 'J\'ai récupéré une course hôpital d\'un collègue qui ne pouvait pas l\'assurer. Elle est apparue directement dans mon agenda. Zéro appel, zéro message. Parfait.',
    avatar: 'SM',
  },
  {
    name: 'Karim Benali',
    role: 'Patron de flotte, 8 chauffeurs, Marseille',
    rating: 5,
    text: 'Je gère 8 chauffeurs depuis un seul écran. Je vois leurs agendas, je publie les courses, ils les récupèrent. J\'ai arrêté d\'envoyer des SMS pour organiser les journées.',
    avatar: 'KB',
  },
  {
    name: 'Amélie Leclerc',
    role: 'Chauffeure taxi, Toulouse',
    rating: 5,
    text: 'Une collègue avait une urgence familiale et m\'a transféré sa course via TaxiLink. En 30 secondes c\'était réglé. Avant ça aurait pris 10 appels.',
    avatar: 'AL',
  },
  {
    name: 'Thomas Roux',
    role: 'Patron de flotte, 12 chauffeurs, Nantes',
    rating: 5,
    text: 'La géolocalisation me permet de savoir en temps réel qui est disponible et où. J\'optimise les attributions sans passer 1h au téléphone chaque matin.',
    avatar: 'TR',
  },
  {
    name: 'Rachid Ouali',
    role: 'Chauffeur taxi, Bordeaux',
    rating: 5,
    text: 'Interface simple, notification immédiate quand ma course est prise. Je sais en temps réel que mon collègue a la course. C\'est tout ce qu\'il me fallait.',
    avatar: 'RO',
  },
]

export function Testimonials() {
  return (
    <section id="temoignages" className="py-24 bg-secondary overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-4">
            <Icon name="star" size={16} className="text-primary" />
            <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Avis chauffeurs</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-4">Ils ont quitté WhatsApp</h2>
          <p className="text-white/50 text-lg">Chauffeurs indépendants et patrons de flotte nous font confiance</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map(t => (
            <div key={t.name} className="glass rounded-2xl p-6">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Icon key={i} name="star" size={14} className={i < t.rating ? 'text-primary' : 'text-white/20'} />
                ))}
              </div>
              <p className="text-white/80 text-sm leading-relaxed mb-5">&quot;{t.text}&quot;</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-secondary font-bold text-xs">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{t.name}</div>
                  <div className="text-white/40 text-xs">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
