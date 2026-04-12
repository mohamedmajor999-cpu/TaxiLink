import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Hors ligne',
  robots: { index: false, follow: false },
}

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-3xl font-black text-secondary mx-auto mb-8">
          T
        </div>

        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-white/60" style={{ fontSize: 40 }}>
            wifi_off
          </span>
        </div>

        <h1 className="text-2xl font-black text-white mb-3">
          Vous êtes hors ligne
        </h1>
        <p className="text-white/50 text-sm leading-relaxed mb-8">
          Vérifiez votre connexion internet et réessayez. Les pages que vous avez visitées restent accessibles en mode hors ligne.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="h-12 px-6 rounded-2xl bg-primary font-bold text-secondary text-sm flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
            Réessayer
          </button>
          <Link
            href="/"
            className="h-12 px-6 rounded-2xl bg-white/10 border border-white/20 font-semibold text-white text-sm flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>home</span>
            Retour à l&apos;accueil
          </Link>
        </div>

        <p className="text-white/20 text-xs mt-8">TaxiLink Pro</p>
      </div>
    </div>
  )
}
