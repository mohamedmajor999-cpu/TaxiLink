import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'

const perks = [
  { icon: 'check_circle',  label: 'Gratuit'           },
  { icon: 'percent',       label: '0% de commission'  },
  { icon: 'all_inclusive', label: 'Accès illimité'    },
]

export function GratuitSection() {
  return (
    <section className="py-24 bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        <h2 className="text-4xl font-black text-secondary mb-4">Gratuit. Pour toujours.</h2>
        <p className="text-secondary/60 text-lg max-w-md mx-auto mb-10">
          Aucune carte bleue requise. Commencez en 2 minutes.
        </p>

        <div className="flex justify-center gap-8 flex-wrap mb-10">
          {perks.map((p) => (
            <div key={p.label} className="flex items-center gap-2">
              <Icon name={p.icon} size={22} className="text-secondary" />
              <span className="text-base font-bold text-secondary">{p.label}</span>
            </div>
          ))}
        </div>

        <Link
          href="/auth/register"
          className="inline-flex items-center gap-2 bg-secondary text-white font-bold text-base px-8 py-4 rounded-2xl hover:opacity-90 transition-all shadow-button"
        >
          Commencer
          <Icon name="arrow_forward" size={20} className="text-white" />
        </Link>

      </div>
    </section>
  )
}
