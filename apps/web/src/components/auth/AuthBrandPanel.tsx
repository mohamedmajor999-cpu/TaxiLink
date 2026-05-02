import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'

interface Props {
  eyebrow?: string
  title: React.ReactNode
  lead?: string
}

export function AuthBrandPanel({ eyebrow = 'Espace chauffeur', title, lead }: Props) {
  return (
    <aside className="hidden lg:flex flex-col justify-between bg-secondary text-white p-12 xl:p-16 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      <Link href="/" className="relative inline-flex items-center" aria-label="TaxiLink Pro">
        <Image src="/brand/logo-primary.svg" alt="TaxiLink Pro" width={224} height={40} priority className="h-10 w-auto brightness-0 invert" />
      </Link>
      <div className="relative max-w-md">
        <p className="text-primary text-sm font-bold uppercase tracking-wider mb-4">{eyebrow}</p>
        <h2 className="text-4xl xl:text-5xl font-black leading-tight mb-6">{title}</h2>
        {lead && <p className="text-white/70 leading-relaxed">{lead}</p>}
      </div>
      <div className="relative grid grid-cols-3 gap-4 text-xs">
        {[
          { icon: 'flash_on', label: 'Rapide' },
          { icon: 'verified_user', label: 'Sécurisé' },
          { icon: 'support_agent', label: 'Support 7/7' },
        ].map(({ icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-white/80">
            <Icon name={icon} size={16} className="text-primary" />
            <span className="font-semibold">{label}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}
