import { Icon } from '@/components/ui/Icon'

const testimonials = [
  { name: 'Marc Fontaine', role: 'Chauffeur taxi, Paris', rating: 5, text: 'Depuis TaxiLink, j\'ai augmenté mon chiffre d\'affaires de 40%. Les missions CPAM arrivent directement sur mon téléphone. Révolutionnaire.', avatar: 'MF' },
  { name: 'Sabine Moreau', role: 'VTC, Lyon', rating: 5, text: 'L\'agenda est vraiment pratique. Je planifie toute ma semaine en 5 minutes. Le virement automatique est un énorme gain de temps.', avatar: 'SM' },
  { name: 'Karim Benali', role: 'Chauffeur CPAM, Marseille', rating: 5, text: 'Interface claire, missions en temps réel, support réactif. Je recommande à tous mes collègues chauffeurs.', avatar: 'KB' },
  { name: 'Claire Dupont', role: 'Patiente CPAM, Bordeaux', rating: 5, text: 'Réservation super simple. Mon chauffeur arrive toujours à l\'heure et l\'application m\'envoie un message de confirmation.', avatar: 'CD' },
  { name: 'Thomas Roux', role: 'Directeur clinique, Nantes', rating: 4, text: 'Nous utilisons TaxiLink pour transporter nos patients. Le suivi en temps réel est très rassurant pour notre personnel soignant.', avatar: 'TR' },
  { name: 'Amélie Leclerc', role: 'Chauffeure taxi, Toulouse', rating: 5, text: 'J\'ai tout sur mon téléphone. Les courses, les paiements, les documents. Plus besoin de jongler entre 4 applications.', avatar: 'AL' },
]

export function Testimonials() {
  return (
    <section id="temoignages" className="py-24 bg-secondary overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-4">
            <Icon name="star" size={16} className="text-primary" />
            <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Avis clients</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-4">Ils nous font confiance</h2>
          <p className="text-white/50 text-lg">+2 400 chauffeurs et clients satisfaits en France</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map(t => (
            <div key={t.name} className="glass rounded-2xl p-6">
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Icon key={i} name="star" size={14} className={i < t.rating ? 'text-primary' : 'text-white/20'} />
                ))}
              </div>
              <p className="text-white/80 text-sm leading-relaxed mb-5">"{t.text}"</p>
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
