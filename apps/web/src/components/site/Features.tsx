import { Icon } from '@/components/ui/Icon'

const features = [
  { icon: 'bolt', title: 'Missions en temps réel', desc: 'Recevez instantanément les nouvelles courses disponibles. Acceptez en un clic avant les autres.', color: 'bg-yellow-50 text-yellow-600' },
  { icon: 'calendar_month', title: 'Agenda intelligent', desc: 'Planifiez vos journées. Vue jour ou semaine. Toutes vos courses CPAM et privées centralisées.', color: 'bg-blue-50 text-blue-600' },
  { icon: 'medical_services', title: 'Agréé CPAM', desc: 'Missions remboursées Sécurité Sociale. Facturation simplifiée. Moins de paperasse, plus de routes.', color: 'bg-green-50 text-green-600' },
  { icon: 'bar_chart', title: 'Tableau de bord complet', desc: 'Suivez vos gains, kilomètres et performances. Exportez vos données comptables en un clic.', color: 'bg-purple-50 text-purple-600' },
  { icon: 'payments', title: 'Virements automatiques', desc: 'Encaissement sécurisé et automatique. Virement mensuel sur votre IBAN. 0% de commission.', color: 'bg-emerald-50 text-emerald-600' },
  { icon: 'smartphone', title: 'App mobile PWA', desc: 'Installez l\'application directement depuis votre navigateur. iOS et Android. Fonctionne hors ligne.', color: 'bg-orange-50 text-orange-600' },
]

export function Features() {
  return (
    <section id="fonctionnalites" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-secondary/5 rounded-full px-4 py-2 mb-4">
            <Icon name="auto_awesome" size={16} className="text-secondary" />
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">Fonctionnalités</span>
          </div>
          <h2 className="text-4xl font-black text-secondary mb-4">Tout ce dont vous avez besoin</h2>
          <p className="text-muted text-lg max-w-xl mx-auto">
            Une plateforme complète pensée pour les chauffeurs professionnels français.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(f => (
            <div key={f.title} className="p-6 rounded-2xl border border-line hover:border-primary/40 hover:shadow-card transition-all group">
              <div className={`w-12 h-12 rounded-2xl ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon name={f.icon} size={22} />
              </div>
              <h3 className="font-bold text-secondary text-lg mb-2">{f.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
