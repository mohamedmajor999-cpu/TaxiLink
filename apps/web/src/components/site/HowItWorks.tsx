import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'

const driverSteps = [
  { n: '01', icon: 'app_registration', title: 'Créez votre compte',     desc: 'Inscription gratuite en 2 minutes. Renseignez votre nom, véhicule et numéro professionnel.' },
  { n: '02', icon: 'add_circle',       title: 'Postez une course',       desc: 'Hôpital, clinique ou course privée. Départ, destination, prix. En 10 secondes c\'est en ligne.' },
  { n: '03', icon: 'notifications',    title: 'Un collègue la récupère', desc: 'Dès qu\'un collègue l\'accepte, vous recevez une notification. La course disparaît de la liste.' },
  { n: '04', icon: 'calendar_month',   title: 'Elle est dans son agenda', desc: 'La course s\'ajoute automatiquement à l\'agenda du chauffeur qui l\'a récupérée. Zéro démarche.' },
]

const patronSteps = [
  { n: '01', icon: 'corporate_fare',   title: 'Créez votre entreprise',    desc: 'Ajoutez le nom de votre société et invitez vos chauffeurs. Chacun a son propre compte.' },
  { n: '02', icon: 'group_add',        title: 'Gérez votre flotte',        desc: 'Visualisez l\'emploi du temps de chaque chauffeur. Agenda jour ou semaine, en un coup d\'œil.' },
  { n: '03', icon: 'send',             title: 'Publiez les courses',       desc: 'Postez une course depuis votre tableau de bord. Elle apparaît immédiatement à vos chauffeurs.' },
  { n: '04', icon: 'gps_fixed',        title: 'Suivez en temps réel',      desc: 'Géolocalisation de vos véhicules. Sachez qui est disponible, où et quand.' },
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
          <p className="text-muted text-lg max-w-xl mx-auto">Démarrez en quelques minutes, que vous soyez chauffeur ou patron de flotte.</p>
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
              Rejoindre en tant que chauffeur
            </Link>
          </div>

          {/* Pour les patrons */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Icon name="corporate_fare" size={20} className="text-secondary" />
              </div>
              <h3 className="text-xl font-black text-secondary">Pour les patrons de flotte</h3>
            </div>
            <div className="space-y-6">
              {patronSteps.map(s => (
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
            <Link href="/auth/register?role=patron"
              className="mt-8 inline-flex h-12 px-6 rounded-xl bg-primary text-secondary font-bold text-sm items-center gap-2 hover:bg-yellow-400 transition-colors btn-ripple">
              <Icon name="corporate_fare" size={18} />
              Gérer ma flotte
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
