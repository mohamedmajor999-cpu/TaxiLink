import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'

interface Props {
  show: boolean
}

export function OnboardingStickyBar({ show }: Props) {
  return (
    <div className={`fixed bottom-0 inset-x-0 z-50 transition-all duration-500 ${
      show ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
    }`}>
      <div className="bg-white/95 backdrop-blur-sm border-t border-line px-4 py-4">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-2">
          <Link href="/auth/register?role=driver"
            className="flex-1 rounded-2xl bg-primary font-black text-secondary text-sm flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors btn-ripple"
            style={{ height: 50 }}>
            <Icon name="directions_car" size={18} />
            Je suis chauffeur
          </Link>
          <Link href="/auth/register?role=patron"
            className="flex-1 rounded-2xl bg-secondary font-black text-white text-sm flex items-center justify-center gap-2 hover:bg-secondary/90 transition-colors btn-ripple"
            style={{ height: 50 }}>
            <Icon name="corporate_fare" size={18} />
            Je gère une flotte
          </Link>
        </div>
        <p className="text-center text-xs text-muted mt-2">
          Déjà un compte ?{' '}
          <Link href="/auth/login" className="font-bold text-secondary hover:text-primary transition-colors">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
