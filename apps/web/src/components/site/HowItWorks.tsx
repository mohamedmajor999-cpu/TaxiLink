import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'

const driverSteps = [
  { n: '01', icon: 'app_registration', title: 'Créez votre compte', desc: 'Inscription gratuite en 2 minutes. Renseignez vos informations professionnelles et votre véhicule.' },
  { n: '02', icon: 'verified', title: 'Validation rapide', desc: 'Notre équipe vérifie vos documents sous 24h. Carte pro, assurance, contrôle technique.' },
  { n: '03', icon: 'explore', title: 'Recevez des missions', desc: 'Activez votre statut "En ligne" et recevez des missions en temps réel. CPAM, privé, plateformes.' },
  { n: '04', icon: 'payments', title: 'Encaissez automatiquement', desc: 'Virement automatique chaque fin de mois directement sur votre IBAN. Zéro démarche.' },
]

const clientSteps = [
  { n: '01', icon: 'person_add', title: 'Créez votre compte', desc: 'Inscription rapide avec votre email. Passager ou établissement de santé.' },
  { n: '02', icon: 'edit_location', title: 'Renseignez votre trajet', desc: 'Adresse de départ, destination, date et heure. CPAM ou course privée.' },
  { n: '03', icon: 'directions_car', title: 'Un chauffeur est assigné', desc: 'Un chauffeur pro proche de chez vous accepte votre demande en quelques minutes.' },
  { n: '04', icon: 'check_circle', title: 'Suivez en temps réel', desc: 'Recevez les mises à jour et évaluez votre course.' },
]

export function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="py-24 bg-bgsoft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
            <Icon name="help_outline" size={16} className="text-secondary" />
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">Comment ça marche</span>
          </div>
          <h2 className="text-4xl font-black text-secondary mb-4">Simple. Rapide. Efficace.</h2>
          <p className="text-muted text-lg max-w-xl mx-auto">Démarrez en quelques minutes, que vous soyez chauffeur ou client.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Pour les chauffeurs */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Icon name="directions_car" size={20} className="text-primary" />
              </div>
              <h3 className="text-xl font-black text-secondary">Pour les chauffeurs</h3>
            </div>
            <div className="space-y-6">
              {driverSteps.map(s => (
                <div key={s.n} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary flex items-center justify-center font-black text-secondary text-sm">
                    {s.n}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name={s.icon} size={16} className="text-secondary" />
                      <h4 className="font-bold text-secondary">{s.title}</h4>
                    </div>
                    <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/auth/register?role=driver"
              className="mt-8 inline-flex h-12 px-6 rounded-xl bg-secondary text-white font-bold text-sm items-center gap-2 hover:bg-secondary/90 transition-colors btn-ripple">
              <Icon name="directions_car" size={18} />
              Devenir chauffeur TaxiLink
            </Link>
          </div>

          {/* Pour les clients */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Icon name="person" size={20} className="text-secondary" />
              </div>
              <h3 className="text-xl font-black text-secondary">Pour les clients</h3>
            </div>
            <div className="space-y-6">
              {clientSteps.map(s => (
                <div key={s.n} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center font-black text-primary text-sm">
                    {s.n}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name={s.icon} size={16} className="text-secondary" />
                      <h4 className="font-bold text-secondary">{s.title}</h4>
                    </div>
                    <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/auth/register?role=client"
              className="mt-8 inline-flex h-12 px-6 rounded-xl bg-primary text-secondary font-bold text-sm items-center gap-2 hover:bg-yellow-400 transition-colors btn-ripple">
              <Icon name="person" size={18} />
              Réserver un taxi
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
