import { Icon } from '@/components/ui/Icon'

const pills = [
  { icon: 'location_on',    label: 'Géolocaliser ses voitures en temps réel' },
  { icon: 'calendar_month', label: "Gérer l'agenda de ses chauffeurs"         },
  { icon: 'assignment_ind', label: 'Assigner des courses à ses chauffeurs'    },
  { icon: 'bar_chart',      label: 'Voir les stats de chaque chauffeur'       },
]

export function PatronSection() {
  return (
    <section className="py-24 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-4">
            <Icon name="business" size={16} className="text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Pour les patrons</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-4">Vous gérez une flotte ?</h2>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            TaxiLink vous donne une vue complète sur vos chauffeurs et vos véhicules, en temps réel.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 max-w-2xl mx-auto">
          {pills.map((pill) => (
            <div
              key={pill.label}
              className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-5 py-3"
            >
              <Icon name={pill.icon} size={20} className="text-primary flex-shrink-0" />
              <span className="text-sm font-semibold text-white">{pill.label}</span>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
